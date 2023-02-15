import { Db, MongoClient, UpdateFilter } from 'mongodb';
import { compareTwoStrings } from 'string-similarity';
import { Album, Data, Rating, Solo, Song, User } from '../types';
import { hash } from './util';

export default class {
    private db: Promise<Db>;
    constructor() {
        const client = new MongoClient(process.env.MONGO_URI!);
        this.db = client.connect().then(() => client.db('song_list'));
    }

    private async getCount(key: keyof Data) {
        const data = (await this.db).collection<Data>('data');
        const count = (await data.findOne({}))![key] + 1;
        await data.updateOne({}, { $set: { [key]: count } });
        return count.toString(16);
    }

    private resolveMap(map: Record<string, number>, max: number) {
        return Promise.all(Object
            .entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, max)
            .map(x => this.getSolo(x[0])));
    }

    async getCredentials(auth: string[]) {
        if (auth.some(x => x.trim().length < 3)) throw 'Usernames and passwords must be at least 3 characters long.';
        if (!/^[a-z0-9_]+$/i.test(auth[0])) throw 'Usernames must only contain English letters, digits and underscores (_).';
        if (await this.getUser(auth[0])) throw 'Username taken.';
        return { name: auth[0].toLowerCase(), password: hash(auth[1]) };
    }

    async getBackup() {
        return Object.fromEntries(await Promise.all((await (await this.db).collections()).map(async x => [x.collectionName, await x.find().toArray()])));
    }

    async getUser(name: string) {
        return (await this.db).collection<User>('users').findOne({ name: name.toLowerCase() });
    }

    async addUser(auth: string[]) {
        return (await this.db).collection<User>('users').insertOne({ ...await this.getCredentials(auth), ratings: [] });
    }

    async editUser(auth: string[], filter: UpdateFilter<User>) {
        return (await this.db).collection<User>('users').updateOne({ name: auth[0].toLowerCase(), password: hash(auth[1]) }, filter);
    }

    async addAlbum(data: Omit<Album, 'id' | 'lowerName' | 'lowerArtist'>) {
        const lower = { lowerName: data.name.toLowerCase(), lowerArtist: data.artist.toLowerCase() };
        const coll = (await this.db).collection<Album>('albums');
        if (await coll.findOne(lower)) throw 'This album is already listed.';
        const id = await this.getCount('albums');
        await coll.insertOne({ ...data, id, ...lower });
        return { id };
    }
    
    async addSong(data: Omit<Song, 'id' | 'lowerName'>) {
        const coll = (await this.db).collection<Song>('songs');
        if (await coll.findOne({ lowerName: data.name.toLowerCase(), album: data.album })) throw 'This song is already listed on the album.';
        if (!await (await this.db).collection<Album>('albums').findOne({ id: data.album })) throw 'Album not found.';
        const id = await this.getCount('songs');
        await coll.insertOne({ ...data, id, lowerName: data.name.toLowerCase() });
        return { id };
    }

    async addSolo(data: Omit<Solo, 'id'>) {
        if (!await (await this.db).collection<Song>('songs').findOne({ id: data.song })) throw 'Song not found.';
        return (await this.db).collection<Solo>('solos').insertOne({ ...data, id: await this.getCount('solos') });
    }

    async getBaseSolo(id: string) {
        const data = await (await this.db).collection<Solo>('solos').findOne({ id });
        if (!data) throw 'Solo not found.';
        return data;
    }

    async getAlbum(id: string) {
        const album = await (await this.db).collection<Album>('albums').findOne({ id });
        if (!album) throw 'Album not found.';
        return [album, await (await this.db).collection<Song>('songs').find({ album: id }).toArray()];
    }

    async getSong(id: string, user?: User) {
        const song = await (await this.db).collection<Song>('songs').findOne({ id });
        if (!song) throw 'Song not found.';
        const users = await (await this.db).collection<User>('users').find().toArray();
        return [
            song,
            await (await this.db).collection<Album>('albums').findOne({ id: song.album }),
            await Promise.all((await (await this.db).collection<Solo>('solos').find({ song: id }).toArray()).map(async s => {
                let sum = 0;
                let count = 0;
                const map: Record<string, number> = {};
                for (const u of users) {
                    const rating = u.ratings.find(x => x.id === s.id);
                    if (rating) {
                        count++;
                        sum += rating.rating;
                        for (const x of u.ratings.filter(x => x.id !== s.id)) map[x.id] = (map[x.id] || 0) + x.rating * rating.rating;
                    }
                }
                return [s, await this.resolveMap(map, 5), sum, count, user?.ratings.find(x => x.id === s.id)?.rating];
            })),
        ];
    }

    async getSolo(id: string) {
        const solo = await this.getBaseSolo(id);
        const song = await (await this.db).collection<Song>('songs').findOne({ id: solo.song });
        const album = await (await this.db).collection<Album>('albums').findOne({ id: song.album });
        return [solo, song, album];
    }

    async discover(user: User) {
        const users = (await (await this.db).collection<User>('users').find().toArray()).filter(x => x.name !== user.name);
        const map: Record<string, number> = {};
        for (const u of users) {
            let score = 0;
            let common = 0;
            const unknown: Rating[] = [];
            for (const x of u.ratings) {
                const other = user.ratings.find(y => y.id === x.id);
                if (!other) unknown.push(x);
                else {
                    common++;
                    score += (x.rating + other.rating) / 2;
                }
            }
            if (common) for (const x of unknown) {
                map[x.id] = (map[x.id] || 0) + score / common * x.rating;
            }
        }
        return this.resolveMap(map, 50);
    }

    async search(str: string) {
        const albums = await (await this.db).collection<Album>('albums').find().toArray();
        const songs = await (await this.db).collection<Song>('songs').find().toArray();
        const matches = [albums, songs].map(arr => arr
            .map(x => [x, compareTwoStrings(str.toLowerCase(), x.lowerName)] as const)
            .filter(x => x[1] > 0.25)
            .sort((a, b) => b[1] - a[1])
            .map(x => x[0])) as [Album[], Song[]];
        return [
            matches[0].map(x => [{}, {}, x]),
            matches[1].map(x => [{}, x, albums.find(y => y.id === x.album)]),
        ];
    }

    async getCharts() {
        const albums = await (await this.db).collection<Album>('albums').find().toArray();
        const songs = await (await this.db).collection<Song>('songs').find().toArray();
        const solos = await (await this.db).collection<Solo>('solos').find().toArray();
        const users = await (await this.db).collection<User>('users').find().toArray();
        return solos.map(s => {
            const ratings = users.map(x => x.ratings.find(x => x.id === s.id)).filter(x => x);
            const song = songs.find(x => x.id === s.song);
            return [s, song, albums.find(x => x.id === song.album), ratings.reduce((a, b) => a + b.rating, 0), ratings.length];
        });
    }
}
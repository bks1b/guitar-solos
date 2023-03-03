import { Db, MongoClient, UpdateFilter, WithId } from 'mongodb';
import { compareTwoStrings } from 'string-similarity';
import { Album, Data, Rating, Solo, Song, User } from '../types';
import { hash } from './util';

export default class {
    db: Promise<Db>;
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

    private resolveMap(map: Record<string, number>, max: number, data: Collections) {
        return Object
            .entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, max)
            .map(x => this.getSolo(x[0], data));
    }

    private getCollections(solos = false, users = false) {
        return <Promise<Collections>>Promise.all(['albums', 'songs', ...solos ? ['solos'] : [], ...users ? ['users'] : []].map(async x => (await this.db).collection(x).find().toArray()));
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

    async getAlbum(id: string) {
        const album = await (await this.db).collection<Album>('albums').findOne({ id });
        if (!album) throw 'Album not found.';
        return [album, await (await this.db).collection<Song>('songs').find({ album: id }).toArray()];
    }

    async getSong(id: string, user?: User) {
        const [albums, songs, solos, users] = await this.getCollections(true, true);
        const song = songs.find(x => x.id === id);
        if (!song) throw 'Song not found.';
        return [
            song,
            albums.find(x => x.id === song.album),
            solos.filter(x => x.song === song.id).map(s => {
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
                return [s, this.resolveMap(map, 5, [albums, songs, solos, users]), sum, count, user?.ratings.find(x => x.id === s.id)?.rating];
            }),
        ];
    }

    getSolo(id: string, [albums, songs, solos]: Collections) {
        const solo = solos.find(x => x.id === id)!;
        const song = songs.find(x => x.id === solo.song)!;
        return [solo, song, albums.find(x => x.id === song.album)];
    }

    async getProfile(name: string) {
        const user = await this.getUser(name);
        if (!user) throw 'User not found.';
        const data = await this.getCollections(true);
        return [user.name, user.ratings.map(x => [...this.getSolo(x.id, data), x.rating])];
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
                map[x.id] = (map[x.id] || 0) + score / common ** 0.7 * x.rating;
            }
        }
        return this.resolveMap(map, 50, await this.getCollections(true));
    }

    async search(str: string) {
        const [albums, songs] = await this.getCollections();
        const matches = ([albums, songs] as unknown as { lowerName: string; }[][]).map(arr => arr
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
        const [albums, songs, solos, users] = await this.getCollections(true, true);
        return solos.map(s => {
            const ratings = users.map(x => x.ratings.find(x => x.id === s.id)).filter(x => x);
            const song = songs.find(x => x.id === s.song)!;
            return [s, song, albums.find(x => x.id === song.album), ratings.reduce((a, b) => a + b!.rating, 0), ratings.length];
        });
    }
}

type Collections = [WithId<Album>[], WithId<Song>[], WithId<Solo>[], WithId<User>[]];
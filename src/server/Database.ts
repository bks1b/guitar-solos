import { Db, MongoClient, UpdateFilter, WithId } from 'mongodb';
import { compareTwoStrings } from 'string-similarity';
import { Album, Auth, ExtendedAuth, Rating, Solo, Solos, Song, User, applyFilters, loadFilters } from '../util';
import { getScore, hash } from './util';

export default class {
    db: Promise<Db>;
    constructor() {
        const client = new MongoClient(process.env.MONGO_URI!);
        this.db = client.connect().then(() => client.db('song_list'));
    }

    private async getNewID(key: keyof Data) {
        const data = (await this.db).collection<Data>('data');
        const count = (await data.findOne({}))![key] + 1;
        await data.updateOne({}, { $set: { [key]: count } });
        return count.toString(16);
    }

    private async getLatestID(key: keyof Data) {
        const data = (await this.db).collection<Data>('data');
        const count = (await data.findOne({}))![key];
        await data.updateOne({}, { $set: { [key]: count - 1 } });
        return count.toString(16);
    }

    private resolveMap(map: Record<string, number>, max: number, data: Collections) {
        return Object
            .entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, max)
            .map(x => this.getSolo(x[0], data));
    }

    getCollections(solos = false, users = false) {
        return <Promise<Collections>>Promise.all(['albums', 'songs', 'solos', 'users'].map(async (x, i) => [true, true, solos, users][i] ? (await this.db).collection(x).find().toArray() : []));
    }

    async getPublicUsers() {
        return (await this.db).collection<User>('users').find({ public: true }).toArray();
    }

    async getCredentials(auth: ExtendedAuth, checkTaken = true) {
        if ([auth[0], auth[1]].some(x => x.trim().length < 3)) throw 'Usernames and passwords must be at least 3 characters long.';
        if ([auth[0], auth[1], auth[2]].some(x => x.trim().length > 100)) throw 'Usernames, passwords and descriptions must be at most 100 characters long.';
        if (!/^[a-z0-9_]+$/i.test(auth[0])) throw 'Usernames must only contain English letters, digits and underscores (_).';
        if (typeof auth[2] !== 'string') throw 'Description expected.';
        if (typeof auth[3] !== 'boolean') throw 'Profile publicness expected.';
        if (checkTaken && await this.getUser(auth[0])) throw 'Username taken.';
        return {
            name: auth[0].trim(),
            lowerName: auth[0].trim().toLowerCase(),
            password: hash(auth[1]),
            description: auth[2].trim(),
            public: auth[3],
        };
    }

    async getBackup() {
        return Object.fromEntries(await Promise.all((await (await this.db).collections()).map(async x => [x.collectionName, await x.find().toArray()])));
    }

    async getUser(name: string) {
        return (await this.db).collection<User>('users').findOne({ lowerName: name.toLowerCase() });
    }

    async addUser(auth: ExtendedAuth) {
        const obj = { ...await this.getCredentials(auth), ratings: [] };
        await (await this.db).collection<User>('users').insertOne(obj);
        return obj;
    }

    async editUser(auth: Auth, filter: UpdateFilter<User>) {
        return (await this.db).collection<User>('users').updateOne({ lowerName: auth[0].toLowerCase(), password: hash(auth[1]) }, filter);
    }

    async addAlbum(data: Omit<Album, 'id' | 'lowerName' | 'lowerArtist'>, admin?: boolean) {
        const lower = { lowerName: data.name.toLowerCase(), lowerArtist: data.artist.toLowerCase() };
        const coll = (await this.db).collection<Album>('albums');
        if (await coll.findOne(lower)) throw 'This album is already listed.';
        const id = await this.getNewID('albums');
        if (!admin) data.unverified = true;
        await coll.insertOne({ ...data, id, ...lower });
        return { id };
    }
    
    async addSong(data: Omit<Song, 'id' | 'lowerName'>, admin?: boolean) {
        const coll = (await this.db).collection<Song>('songs');
        if (await coll.findOne({ lowerName: data.name.toLowerCase(), album: data.album })) throw 'This song is already listed on the album.';
        if (!await (await this.db).collection<Album>('albums').findOne({ id: data.album })) throw 'Album not found.';
        const id = await this.getNewID('songs');
        if (!admin) data.unverified = true;
        await coll.insertOne({ ...data, id, lowerName: data.name.toLowerCase() });
        return { id };
    }

    async addSolo(data: Omit<Solo, 'id'>, admin?: boolean) {
        if (!await (await this.db).collection<Song>('songs').findOne({ id: data.song })) throw 'Song not found.';
        if (!admin) data.unverified = true;
        return (await this.db).collection<Solo>('solos').insertOne({ ...data, id: await this.getNewID('solos') });
    }

    async getAlbum(id: string) {
        const album = await (await this.db).collection<Album>('albums').findOne({ id });
        if (!album) throw 'Album not found.';
        const songs = await (await this.db).collection<Song>('songs').find({ album: id }).toArray();
        const solos = await (await this.db).collection<Solo>('solos').find({ song: { $in: songs.map(x => x.id) } }).toArray();
        const ratings = (await (await this.db).collection<User>('users').find().toArray()).flatMap(u => u.ratings.filter(x => solos.some(s => s.id === x.id)));
        return [album, songs, solos.length, ratings.reduce((a, b) => a + b.rating, 0) / ratings.length, ratings.length];
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
        return <const>[solo, song, albums.find(x => x.id === song.album)!];
    }

    async getProfile(name: string) {
        const user = await this.getUser(name);
        if (!user) throw 'User not found.';
        const data = await this.getCollections(true);
        return [user.name, user.description, user.ratings.map(x => [...this.getSolo(x.id, data), x.rating])];
    }

    async getProfileStats(name: string, params: Record<string, any>) {
        const user = await this.getUser(name);
        if (!user) throw 'User not found.';
        const data = await this.getCollections(true);
        return this.getStats(applyFilters(loadFilters(params), user.ratings.map(x => [...this.getSolo(x.id, data), x.rating, 0])), data);
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
        const [albums, songs, solos] = await this.getCollections(true);
        const users = await this.getPublicUsers();
        const matches = ([albums, songs, users] as unknown as { lowerName: string; }[][]).map(arr => arr
            .map(x => [x, compareTwoStrings(str.toLowerCase(), x.lowerName)] as const)
            .filter(x => x[1] > 0.25)
            .sort((a, b) => b[1] - a[1])
            .map(x => x[0])) as [Album[], Song[], User[]];
        return [
            matches[0].map(x => [{}, {}, x]),
            matches[1].map(x => [{}, x, albums.find(y => y.id === x.album)]),
            matches[2].map(x => x.name),
            ...[albums.map(x => x.artist), solos.flatMap(x => x.guitarists), songs.flatMap(x => x.genres)].map(arr => [...new Set(arr)]
                .map(x => [x, compareTwoStrings(str.toLowerCase(), x.toLowerCase())] as const)
                .filter(x => x[1] > 0.25)
                .sort((a, b) => b[1] - a[1])
                .map(x => x[0]),
            ),
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

    getStats(ratings: Solos, [albums, songs, solos, users]: Collections) {
        const ratedSolos = solos.map(x => <const>[x, ratings.filter(r => r[0].id === x.id).map(r => r[3])]).filter(x => x[1].length);
        const ratedSongs = songs.map(x => <const>[x, ratedSolos.filter(s => s[0].song === x.id)]).filter(s => s[1].length);
        const albumScores = albums.map(x => {
            const songArr = ratedSongs.filter(s => s[0].album === x.id);
            const soloArr = songArr.flatMap(s => s[1]);
            return <const>[x, songArr.length, soloArr.length, soloArr.flatMap(s => s[1])];
        }).filter(x => x[2]);
        const obj = {
            ...<Record<'artists' | 'years', any[]>>Object.fromEntries((<const>['artist', 'year']).map(k => [k + 's', [...new Set(albumScores.map(x => x[0][k]))].map(x => {
                const arr = albumScores.filter(a => a[0][k] === x);
                return <const>[x + '', arr.reduce((a, b) => a + b[1], 0), arr.reduce((a, b) => a + b[2], 0), ...getScore(arr.flatMap(a => a[3])), arr.length];
            })])),
            guitarists: [...new Set(ratedSolos.flatMap(x => x[0].guitarists))].map(x => {
                const arr = ratedSolos.filter(s => s[0].guitarists.includes(x));
                return <const>[
                    x,
                    new Set(arr.map(s => this.getSolo(s[0].id, <Collections><unknown>[albums, songs, solos])[2].artist)).size,
                    arr.length,
                    ...getScore(arr.flatMap(s => s[1])),
                ];
            }),
            genres: [...new Set(ratedSongs.flatMap(x => x[0].genres))].map(x => {
                const songArr = ratedSongs.filter(s => s[0].genres.includes(x));
                const soloArr = songArr.flatMap(s => s[1]);
                return <const>[x, songArr.length, soloArr.length, ...getScore(soloArr.flatMap(s => s[1]))];
            }),
        };
        return {
            total: [users?.length, ratedSolos.length, ratedSongs.length, albumScores.length, obj.artists.length, obj.guitarists.length],
            averageDuration: ratedSolos.reduce((a, b) => a + b[0].end - b[0].start, 0) / ratedSolos.length,
            ratings: Array.from({ length: 11 }, (_, i) => [i, ratings.filter(x => x[3] === i).length]).filter(x => x[1]),
            albums: albumScores.map(x => <const>[x[0], x[1], x[2], ...getScore(x[3])]),
            ...obj,
        };
    }

    async getTotalStats(params: Record<string, any>) {
        const data = await this.getCollections(true, true);
        return this.getStats(applyFilters(loadFilters(params), <Solos>data[3].flatMap(x => x.ratings.map(r => [...this.getSolo(r.id, data), r.rating]))), data);
    }

    async edit(entry: string[], data: any) {
        (await this.db).collection(entry[0]).updateOne({ id: entry[1] }, { $set: data });
    }

    async verify(entry: string[]) {
        (await this.db).collection(entry[0]).updateOne({ id: entry[1] }, { $unset: { unverified: '' } });
    }

    async getAdminData() {
        const [albums, songs, solos] = await this.getCollections(true);
        return {
            unverified: [
                albums.filter(x => x.unverified),
                songs.filter(x => x.unverified).map(x => [x, albums.find(a => a.id === x.album)]),
                solos.filter(x => x.unverified).map(x => this.getSolo(x.id, <Collections><unknown>[albums, songs, solos])),
            ],
            noGuitarists: [...new Set(solos.filter(x => !x.guitarists.length).map(x => x.song))].map(x => {
                const song = songs.find(s => s.id === x)!;
                return [song, albums.find(a => a.id === song.album)];
            }),
        };
    }

    async deleteAlbum(id: string) {
        const albumsColl = (await this.db).collection('albums');
        const songsColl = (await this.db).collection<Song>('songs');
        const songs = await songsColl.find({ album: id }).toArray();
        for (const s of songs) await this.deleteSong(s.id);
        await albumsColl.deleteOne({ id });
        const latestID = await this.getLatestID('albums');
        if (id !== latestID) {
            await albumsColl.updateOne({ id: latestID }, { $set: { id } });
            await songsColl.updateMany({ album: latestID }, { $set: { album: id } });
        }
    }

    async deleteSong(id: string) {
        const songsColl = (await this.db).collection('songs');
        const solosColl = (await this.db).collection<Solo>('solos');
        const solos = await songsColl.find({ song: id }).toArray();
        for (const s of solos) await this.deleteSolo(s.id);
        await songsColl.deleteOne({ id });
        const latestID = await this.getLatestID('songs');
        if (id !== latestID) {
            await songsColl.updateOne({ id: latestID }, { $set: { id } });
            await solosColl.updateMany({ song: latestID }, { $set: { song: id } });
        }
    }

    async deleteSolo(id: string) {
        const solosColl = (await this.db).collection('solos');
        const usersColl = (await this.db).collection<User>('users');
        const removeUsers = await usersColl.find({ 'ratings.id': id }).toArray();
        for (const u of removeUsers) await usersColl.updateOne({ name: u.name }, { $set: { ratings: u.ratings.filter(r => r.id !== id) } });
        await solosColl.deleteOne({ id });
        const latestID = await this.getLatestID('solos');
        if (id !== latestID) {
            await solosColl.updateOne({ id: latestID }, { $set: { id } });
            const replaceUsers = await usersColl.find({ 'ratings.id': latestID }).toArray();
            for (const u of replaceUsers) await usersColl.updateOne({ name: u.name }, { $set: { ratings: u.ratings.map(r => r.id === latestID ? { ...r, id } : r) } });
        }
    }
}

type Data = Record<'albums' | 'songs' | 'solos', number>;
type Collections = [WithId<Album>[], WithId<Song>[], WithId<Solo>[], WithId<User>[]];
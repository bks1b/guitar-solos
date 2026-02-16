import { Db, MongoClient } from 'mongodb';
import { hash } from 'bcrypt';
import { Album, Solo, Song, User } from '../util';

const SALT_ROUNDS = 10;

const userKeys = <const>['name', 'password', 'description'];

const callback = (id: any) => (x: any) => Object.entries(id).every(k => (x[k[0]] + '').toLowerCase() === k[1] + '');

export default class {
    db: Promise<Db>;
    collections: Promise<Record<string, any[]>>;
    constructor() {
        const client = new MongoClient(process.env.MONGO_URI!);
        this.db = client.connect().then(() => client.db('song_list'));
        this.collections = this.db.then(async db => Object.fromEntries(await Promise.all(
            (await db.collections()).map(async x => [x.collectionName, await x.find().toArray()]),
        )));
    }

    get<T>(k: string): Promise<T[]>;
    get<T>(k: string, id: any): Promise<T>;
    get<T>(k: string, id: any, f: boolean): Promise<T[]>;
    async get(k: string, id?: any, f?: boolean) {
        const c = (await this.collections)[k];
        return id ? c[f ? 'filter' : 'find'](callback(id)) : c;
    }

    async set(k: string, id: any, set: any, unset?: string[]) {
        (await this.get<any>(k, id, true)).forEach(obj => {
            Object.assign(obj, set);
            if (unset) unset.forEach(s => delete obj[s]);
        });
        return (await this.db).collection(k).updateMany(id, {
            $set: set,
            ...unset ? { $unset: Object.fromEntries(unset.map(s => [s, ''])) } : {},
        });
    }

    async add(k: string, d: any) {
        (await this.collections)[k].push(d);
        return (await this.db).collection(k).insertOne(d);
    }

    async delete(k: string, id: any) {
        (await this.collections)[k].splice((await this.collections)[k].findIndex(callback(id)), 1);
        return (await this.db).collection(k).deleteOne(id);
    }

    async getID(key: keyof Counts, del = false) {
        const count = (await this.get<Counts>('data'))![0][key];
        await this.set('data', {}, { [key]: count + (1 - 2 * +del) });
        return (count + +!del).toString(16);
    }

    getCollections() {
        return <Promise<Collections>>Promise.all(['albums', 'songs', 'solos', 'users'].map(x => this.get(x)));
    }

    getPublicUsers() {
        return this.get<User>('users', { public: true }, true);
    }

    async verifyUser(data: User, checkTaken = true) {
        userKeys.forEach(k => data[k] = data[k].trim());
        data.name = data.name.trim();
        data.password = await hash(data.password.trim(), SALT_ROUNDS);
        data.description = data.description?.trim() || '';
        data.public = !!data.public;
        data.ratings ||= [];
        data.version ||= 0;
        if (userKeys.slice(0, 2).some(k => data[k].length < 3)) throw 'Usernames and passwords must be at least 3 characters long';
        if (userKeys.some(k => data[k].length > 100)) throw 'Usernames, passwords and descriptions must be at most 100 characters long';
        if (!/^[a-z0-9_]+$/i.test(data.name)) throw 'Usernames must only contain English letters, digits and underscores (_)';
        if (checkTaken && await this.getUser(data.name)) throw 'Username taken';
        return data;
    }

    getUser(name: string) {
        return this.get<User>('users', { name: name.toLowerCase() });
    }
}

export const resolveMap = (map: Record<string, number>, max: number, data: Collections) => Object
    .entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(x => getSolo(x[0], data));
export const getSolo = (id: string, [albums, songs, solos]: Collections) => {
    const solo = solos.find(x => x.id === id)!;
    const song = songs.find(x => x.id === solo.song)!;
    return <const>[solo, song, albums.find(x => x.id === song.album)!];
};

export type Collections = [Album[], Song[], Solo[], User[]];
type Counts = Record<'albums' | 'songs' | 'solos', number>;
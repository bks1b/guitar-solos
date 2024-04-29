import { Db, MongoClient } from 'mongodb';

const callback = (id: any) => (x: any) => Object.entries(id).every(k => x[k[0]] === k[1]);

export default class {
    db: Promise<Db>;
    collections: Promise<Record<string, any[]>>;
    constructor() {
        const client = new MongoClient(process.env.MONGO_URI!);
        this.db = client.connect().then(() => client.db('song_list'));
        this.collections = this.db.then(async db => Object.fromEntries(await Promise.all((await db.collections()).map(async x => [x.collectionName, await x.find().toArray()]))));
    }

    get<T>(k: string): Promise<T[]>;
    get<T>(k: string, id: any): Promise<T>;
    get<T>(k: string, id: any, f: boolean): Promise<T[]>;
    async get(k: string, id?: any, f?: boolean) {
        return id ? (await this.collections)[k][f ? 'filter' : 'find'](callback(id)) : (await this.collections)[k];
    }

    async set(k: string, id: any, set: any, unset?: string[]) {
        (await this.get<any>(k, id, true)).forEach(obj => {
            Object.assign(obj, set);
            if (unset) unset.forEach(s => delete obj[s]);
        });
        return (await this.db).collection(k).updateMany(id, { $set: set, ...unset ? { $unset: Object.fromEntries(unset.map(s => [s, ''])) } : {} });
    }

    async add(k: string, d: any) {
        (await this.collections)[k].push(d);
        return (await this.db).collection(k).insertOne(d);
    }

    async delete(k: string, id: any) {
        (await this.collections)[k].splice((await this.collections)[k].findIndex(callback(id)), 1);
        return (await this.db).collection(k).deleteOne(id);
    }
}
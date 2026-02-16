import { Router } from 'express';
import Database, { Collections, getSolo } from '../Database';
import { Solo, Song, User } from '../../util';

const getRatedUsers = (db: Database, id: string) => db
    .get<User>('users')
    .then(d => d.filter(x => x.ratings.some(r => r.id === id)));
const deleteSong = async (db: Database, id: string) => {
    const solos = await db.get<Solo>('solos', { song: id }, true);
    for (const s of solos) await deleteSolo(db, s.id);
    await db.delete('songs', { id });
    const latestID = await db.getID('songs', true);
    if (id !== latestID) {
        await db.set('songs', { id: latestID }, { id });
        await db.set('solos', { song: latestID }, { song: id });
    }
};
const deleteSolo = async (db: Database, id: string) => {
    for (const u of await getRatedUsers(db, id)) await db.set('users', { name: u.name }, {
        ratings: u.ratings.filter(r => r.id !== id),
    });
    await db.delete('solos', { id });
    const latestID = await db.getID('solos', true);
    if (id !== latestID) {
        await db.set('solos', { id: latestID }, { id });
        for (const u of await getRatedUsers(db, latestID))
            await db.set('users', { name: u.name }, {
                ratings: u.ratings.map(r => r.id === latestID ? { ...r, id } : r),
            });
    }
};

export default (db: Database) => Router()
    .use((req, res, next) => req.user!.admin ? next() : res.status(403).json({ error: 'No admin privileges' }))
    .get('/backup', async (_, res) => res.json(await db.collections))
    .get('/data', async (_, res) => {
        const [albums, songs, solos] = await db.getCollections();
        res.json({
            unverified: [
                albums.filter(x => x.unverified),
                songs.filter(x => x.unverified).map(x => [x, albums.find(a => a.id === x.album)]),
                solos.filter(x => x.unverified).map(x => getSolo(x.id, <Collections><unknown>[albums, songs, solos])),
            ],
            ...Object.fromEntries((<const>['guitarists', 'tags']).map(k => [
                k,
                [...new Set(solos.filter(x => !x[k].length).map(x => x.song))].map(x => {
                    const song = songs.find(s => s.id === x)!;
                    return [song, albums.find(a => a.id === song.album)];
                }),
            ])),
        });
    })
    .delete('/albums', async (req, res) => {
        const songs = await db.get<Song>('songs', { album: req.body.id }, true);
        for (const s of songs) await deleteSong(db, s.id);
        await db.delete('albums', { id: req.body.id });
        const latestID = await db.getID('albums', true);
        if (req.body.id !== latestID) {
            await db.set('albums', { id: latestID }, { id: req.body.id });
            await db.set('songs', { album: latestID }, { album: req.body.id });
        }
        res.json({});
    })
    .delete('/:type', (req, res) => (req.params.type === 'song' ? deleteSong : deleteSolo)(db, req.body.id).then(() => res.json({})))
    .put('/:type', (req, res) => db
        .set(req.params.type, { id: req.body.id }, ...<[any, any?]>req.body.data || <const>[{}, ['unverified']])
        .then(() => res.json({})));
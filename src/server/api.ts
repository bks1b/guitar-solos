import { Router, Request, RequestHandler } from 'express';
import fetch from 'node-fetch';
import { Auth, Solo, User } from '../types';
import Database from './Database';
import { hash } from './util';

export const db = new Database();

const checkInt = (n: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0;
const checkAuth = (arr: Auth) => {
    if (!Array.isArray(arr) || ![2, 3].includes(arr.length) || arr.slice(0, 2).some(x => typeof x !== 'string')) throw 'Invalid authorization.';
};
const getHeader = (req: Request) => {
    const arr: Auth = JSON.parse(req.headers.authorization!);
    checkAuth(arr);
    return arr;
};
const getUser = async (auth: Auth) => {
    const user = await db.getUser(auth[0]);
    if (!user) throw 'User not found.';
    if (user?.password !== hash(auth[1])) throw 'Incorrect credentials.';
    return user;
};
const filterUser = async (p: Promise<User>) => ({ ...await p, password: undefined, ratings: undefined });

const handler = (fn: (req: Request, u: User) => any, u?: boolean): RequestHandler => async (req, res) => {
    try {
        res.json(await fn(req, u ? await getUser(getHeader(req)) : undefined!) || {});
    } catch (e) {
        res.json({ error: e + '' });
    }
};

export default Router()
    .post('/auth/login', handler(async req => {
        checkAuth(req.body);
        return filterUser(getUser(req.body));
    }))
    .post('/auth/signup', handler(req => {
        checkAuth(req.body);
        return filterUser(db.addUser(req.body));
    }))
    .post('/auth/edit', handler(async req => {
        const header = getHeader(req);
        checkAuth(req.body);
        return filterUser(db.editUser(header, { $set: await db.getCredentials(req.body, req.body[0] !== header[0]) }));
    }))
    .post('/add/album', handler((req, u) => {
        if (typeof req.body?.name !== 'string' || !req.body.name.trim()) throw 'Name expected.';
        if (typeof req.body?.artist !== 'string' || !req.body.artist.trim()) throw 'Artist expected.';
        if (!checkInt(req.body?.year)) throw 'Year expected to be a nonnegative integer.';
        return db.addAlbum({
            name: req.body.name.trim(),
            artist: req.body.artist.trim(),
            cover: req.body.cover?.trim() || '/cover.png',
            year: req.body.year,
        }, u.admin);
    }, true))
    .post('/add/song', handler((req, u) => {
        if (typeof req.body?.album !== 'string') throw 'Album expected.';
        if (typeof req.body?.name !== 'string' || !req.body.name.trim()) throw 'Name expected.';
        if (!Array.isArray(req.body?.genres) || !(req.body.genres as string[]).filter(x => x.trim()).length) throw 'Genres expected.';
        if (typeof req.body?.youtube !== 'string') throw 'YouTube URL or ID expected.';
        const youtube = req.body.youtube.match(/(.*youtu\.be\/|.*[?&]v=)?([^?& ]+)/)?.[2];
        if (!youtube) throw 'Invalid YouTube URL or ID.';
        return db.addSong({
            album: req.body.album,
            name: req.body.name.trim(),
            youtube,
            genres: (req.body.genres as string[]).map(x => x.trim().toLowerCase()),
        }, u.admin);
    }, true))
    .post('/add/solo', handler(async (req, u) => {
        if (typeof req.body?.song !== 'string') throw 'Song expected.';
        if (!checkInt(req.body?.start)) throw 'Start expected to be a nonnegative integer.';
        if (!checkInt(req.body?.end)) throw 'End expected to be a nonnegative integer.';
        if (!Array.isArray(req.body?.guitarists)) throw 'Guitarists expected.';
        await db.addSolo({
            song: req.body.song,
            start: req.body.start,
            end: req.body.end,
            guitarists: (req.body.guitarists as string[]).map(x => x.trim()),
        }, u.admin);
    }, true))
    .get('/get/album', handler(async req => {
        if (typeof req.query.id !== 'string') throw 'ID expected.';
        return db.getAlbum(req.query.id);
    }))
    .get('/get/song', handler(async req => {
        if (typeof req.query.id !== 'string') throw 'ID expected.';
        return db.getSong(req.query.id, req.headers.authorization ? await getUser(getHeader(req)) : undefined);
    }))
    .post('/rate', handler(async (req, u) => {
        if (typeof req.body?.id !== 'string') throw 'ID expected.';
        if (!checkInt(req.body?.rating) || req.body.rating > 10) throw 'Rating expected to be an integer between 0 and 10 (inclusive).';
        if (!await (await db.db).collection<Solo>('solos').findOne({ id: req.body.id })) throw 'Solo not found.';
        await db.editUser(getHeader(req), { $set: { ratings: [...u.ratings.filter(x => x.id !== req.body.id), { id: req.body.id, rating: req.body.rating }] } });
    }, true))
    .get('/discover', handler((_, u) => db.discover(u), true))
    .post('/profile', handler(async req => {
        if (typeof req.body?.name !== 'string') throw 'Name expected.';
        return db.getProfile(req.body.name);
    }))
    .post('/search', handler(req => {
        if (!req.body?.str || typeof req.body?.str !== 'string') throw 'Query expected.';
        return db.search(req.body.str);
    }))
    .get('/charts', handler(() => db.getCharts()))
    .get('/stats', handler(() => db.getStats()))
    .post('/genius', handler(req => fetch('https://genius.com/api/search/album?page=1&q=' + req.body.query)
        .then(d => d.json())
        .then(d => d.response.sections[0].hits.map((x: any) => [
            x.result.name,
            x.result.artist.name,
            x.result.release_date_components?.year,
            (x.result.cover_art_url as string)?.replace(/\.(\d+)x(\d+)/, (s, a, b) => a === b ? '.300x300' : s),
        ])),
    ))
    .post('/admin/backup', handler((_, u) => {
        if (u.admin) return db.getBackup();
    }, true))
    .post('/admin/unverified', handler((_, u) => {
        if (u.admin) return db.getUnverified();
    }, true))
    .post('/admin/edit', handler(async (req, u) => {
        if (u.admin) await db.edit(req.body.entry, req.body.data);
    }, true))
    .post('/admin/verify', handler(async (req, u) => {
        if (u.admin) await db.verify(req.body.entry);
    }, true))
    .post('/admin/delete/album', handler(async (req, u) => {
        if (u.admin) await db.deleteAlbum(req.body.id);
    }, true))
    .post('/admin/delete/song', handler(async (req, u) => {
        if (u.admin) await db.deleteSong(req.body.id);
    }, true))
    .post('/admin/delete/solo', handler(async (req, u) => {
        if (u.admin) await db.deleteSolo(req.body.id);
    }, true));
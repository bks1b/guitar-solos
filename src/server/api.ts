import { Router, Request, RequestHandler } from 'express';
import { User } from '../types';
import Database from './Database';
import { hash } from './util';

const db = new Database();

const checkInt = (n: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0;
const checkAuth = (arr: string[]) => {
    if (!Array.isArray(arr) || arr.length !== 2 || arr.some(x => typeof x !== 'string')) throw 'Invalid authorization.';
};
const getHeader = (req: Request) => {
    const arr = JSON.parse(req.headers.authorization!);
    checkAuth(arr);
    return arr;
};
const getUser = async (auth: string[]) => {
    const user = await db.getUser(auth[0]);
    if (!user) throw 'User not found.';
    if (user?.password !== hash(auth[1])) throw 'Incorrect credentials.';
    return user;
};

const handler = (fn: (req: Request, u: User) => any, u?: boolean): RequestHandler => async (req, res) => {
    try {
        res.json(await fn(req, u ? await getUser(getHeader(req)) : undefined) || {});
    } catch (e) {
        res.json({ error: e + '' });
    }
};

export default Router()
    .post('/auth/login', handler(async req => {
        checkAuth(req.body);
        return (await getUser(req.body)).name;
    }))
    .post('/auth/signup', handler(async req => {
        checkAuth(req.body);
        await db.addUser(req.body);
        return req.body[0];
    }))
    .post('/auth/edit', handler(async req => {
        checkAuth(req.body);
        await db.editUser(getHeader(req), { $set: await db.getCredentials(req.body) });
        return req.body[0].toLowerCase();
    }))
    .post('/add/album', handler(req => {
        if (typeof req.body?.name !== 'string' || !req.body.name.trim()) throw 'Album "name" expected.';
        if (typeof req.body?.artist !== 'string' || !req.body.artist.trim()) throw 'Album "artist" expected.';
        if (typeof req.body?.cover !== 'string' || !req.body.cover.trim()) throw 'Album "cover" expected.';
        if (!checkInt(req.body?.year)) throw 'Album "year" expected to be a positive integer.';
        return db.addAlbum({
            name: req.body.name.trim(),
            artist: req.body.artist.trim(),
            cover: req.body.cover.trim(),
            year: req.body.year,
        });
    }, true))
    .post('/add/song', handler(req => {
        if (typeof req.body?.album !== 'string') throw 'Song "album" expected.';
        if (typeof req.body?.name !== 'string' || !req.body.name.trim()) throw 'Song "name" expected.';
        if (typeof req.body?.youtube !== 'string' || !req.body.youtube.trim()) throw 'Song "youtube" (video ID) expected.';
        if (!Array.isArray(req.body?.genres) || !req.body.genres.filter(x => x.trim()).length) throw 'Song "genres" expected.';
        return db.addSong({
            album: req.body.album,
            name: req.body.name.trim(),
            youtube: req.body.youtube.trim(),
            genres: req.body.genres.map(x => x.trim().toLowerCase()),
        });
    }, true))
    .post('/add/solo', handler(async req => {
        if (typeof req.body?.song !== 'string') throw 'Solo "song" expected.';
        if (!checkInt(req.body?.start)) throw 'Solo "start" expected to be a positive integer.';
        if (!checkInt(req.body?.end)) throw 'Solo "end" expected to be a positive integer.';
        await db.addSolo({ song: req.body.song, start: req.body.start, end: req.body.end });
    }, true))
    .post('/get/album', handler(async req => {
        if (typeof req.body?.id !== 'string') throw 'Album "id" expected.';
        return db.getAlbum(req.body.id);
    }))
    .post('/get/song', handler(async req => {
        if (typeof req.body?.id !== 'string') throw 'Song "id" expected.';
        return db.getSong(req.body.id, req.headers.authorization ? await getUser(getHeader(req)) : undefined);
    }))
    .post('/rate', handler(async (req, u) => {
        if (typeof req.body?.id !== 'string') throw 'Rating "id" expected.';
        if (!checkInt(req.body?.rating) || req.body.rating > 10) throw 'Rating "rating" expected to be an integer between 0 and 10 (inclusive).';
        await db.getBaseSolo(req.body.id);
        await db.editUser(getHeader(req), { $set: { ratings: [...u.ratings.filter(x => x.id !== req.body.id), { id: req.body.id, rating: req.body.rating }] } });
    }, true))
    .post('/discover', handler((_, u) => db.discover(u), true))
    .post('/profile', handler(async req => {
        if (typeof req.body?.name !== 'string') throw 'User "name" expected.';
        const user = await db.getUser(req.body.name);
        if (!user) throw 'User not found.';
        return [user.name, await Promise.all(user.ratings.map(async x => [...await db.getSolo(x.id), x.rating]))];
    }))
    .post('/search', handler(req => {
        if (!req.body?.str || typeof req.body?.str !== 'string') throw 'Search "str" expected.';
        return db.search(req.body.str);
    }))
    .post('/charts', handler(() => db.getCharts()))
    .get('/backup', (req, res, next) => {
        if (req.query.auth !== process.env.PASSWORD) return next();
        res.setHeader('content-type', 'application/json');
        res.setHeader('content-disposition', 'attachment; filename=solos.json');
        db.getBackup().then(d => res.json(d));
    });
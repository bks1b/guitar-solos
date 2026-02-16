import { Router } from 'express';
import { Album } from '../../util';
import Database from '../Database';

const YOUTUBE_URL = 'https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails';

const checkInt = (n: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0;
const checkStringArray = (a: string[], nonempty = false) => Array.isArray(a)
    && a.every(s => typeof s === 'string')
    && (!nonempty || a.filter(x => x.trim()).length);
const trimArray = (a: string[], lower = false) => a
    .map(x => (s => lower ? s.toLowerCase() : s)(x.trim()))
    .filter(x => x);

export default (db: Database) => Router()
    .post('/albums', async (req, res) => {
        if (!checkInt(req.body?.year) || !req.body.year) throw 'Year expected to be a positive integer';
        if (!checkStringArray(req.body.defaultGenres)) throw 'Default genres expected';
        const data = <Album>{
            name: req.body.name.trim(),
            artist: req.body.artist.trim(),
            cover: req.body.cover?.trim() || '/cover.png',
            year: req.body.year,
            defaultGenres: trimArray(req.body.defaultGenres, true),
            ...req.user!.admin ? {} : { unverified: true },
        };
        if (await db.get('albums', {
            artist: data.artist.toLowerCase(),
            name: data.name.toLowerCase(),
        })) throw 'This album is already listed';
        data.id = await db.getID('albums');
        await db.add('albums', data);
        res.json({ id: data.id });
    })
    .post('/songs', async (req, res) => {
        if (typeof req.body?.album !== 'string') throw 'Album expected';
        if (typeof req.body?.name !== 'string' || !req.body.name.trim()) throw 'Name expected';
        if (!checkStringArray(req.body?.genres, true)) throw 'Genres expected';
        if (typeof req.body?.youtube !== 'string') throw 'YouTube URL or ID expected';
        const youtube = req.body.youtube.match(/(.*youtu\.be\/|.*[?&]v=)?([^?& ]+)/)?.[2];
        if (!youtube) throw 'Invalid YouTube URL or ID';
        if (await db.get('songs', { name: req.body.name.toLowerCase(), album: req.body.album })) throw 'This song is already listed on the album';
        if (!await db.get('albums', { id: req.body.album })) throw 'Album not found';
        const yt = await fetch(`${YOUTUBE_URL}&id=${youtube}&key=${process.env.YOUTUBE_KEY}`, {
            headers: { accept: 'application/json' },
        }).then(d => d.json());
        if (!yt.error && !yt.items.length) throw 'YouTube video not found';
        const id = await db.getID('songs');
        await db.add('songs', {
            album: req.body.album,
            name: req.body.name.trim(),
            youtube,
            genres: trimArray(req.body.genres, true),
            duration: yt.error ? 0 : [...yt.items[0].contentDetails.duration.matchAll(/(\d+)([HMS])/g)]
                .reduce((a, b) => a + b[1] * 60 ** 'SMH'.indexOf(b[2]), 0),
            id,
            ...req.user!.admin ? {} : { unverified: true },
        });
        res.json({ id });
    })
    .post('/solos', async (req, res) => {
        if (typeof req.body?.song !== 'string') throw 'Song expected';
        if (!checkInt(req.body?.start)) throw 'Start expected to be a nonnegative integer';
        if (!checkInt(req.body?.end)) throw 'End expected to be a nonnegative integer';
        if (req.body.start >= req.body.end) throw 'End is expected to be greater than start';
        if (!checkStringArray(req.body?.guitarists)) throw 'Guitarists expected';
        if (!checkStringArray(req.body?.tags)) throw 'Tags expected';
        if (!await db.get('songs', { id: req.body.song })) throw 'Song not found';
        await db.add('solos', {
            song: req.body.song,
            start: req.body.start,
            end: req.body.end,
            guitarists: trimArray(req.body.guitarists),
            tags: trimArray(req.body.tags, true),
            id: await db.getID('solos'),
            ...req.user!.admin ? {} : { unverified: true },
        });
        res.json({});
    })
    .post('/rate', async (req, res) => {
        if ('rating' in req.body && (!checkInt(req.body.rating) || req.body.rating > 10)) throw 'Rating expected to be an integer between 0 and 10 (inclusive)';
        if (!await db.get('solos', { id: req.body.id })) throw 'Solo not found';
        await db.set('users', { _id: req.user!._id }, {
            ratings: [
                ...req.user!.ratings.filter(x => x.id !== req.body.id),
                ...'rating' in req.body ? [{ id: req.body.id, rating: req.body.rating }] : [],
            ],
        });
        res.json({});
    });
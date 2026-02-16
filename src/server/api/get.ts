import { Router } from 'express';
import { compareTwoStrings } from 'string-similarity';
import Database, { Collections, getSolo, resolveMap } from '../Database';
import { Album, COUNT_WEIGHT, Solo, Solos, Song, User, applyFilters, loadFilters } from '../../util';

const RECOMMEND_COUNT = 5;
const SEARCH_THRESHOLD = 0.25;

const getScore = (arr: number[]) => {
    if (!arr.length) return [0, 0, 0];
    const sum = arr.reduce((a, b) => a + b, 0);
    return [sum / arr.length ** COUNT_WEIGHT, sum / arr.length, arr.length];
};
const getRatings = (user: User, data: Collections) => <Solos>user.ratings.map(x => [...getSolo(x.id, data), x.rating, 0]);
const getProfile = async (db: Database, name: string) => {
    const user = await db.getUser(name);
    if (!user) throw 'User not found';
    return <const>[user, getRatings(user, await db.getCollections())];
};
const getStats = (ratings: Solos, [albums, songs, solos, users]: Collections) => {
    const ratedSolos = solos
        .map(x => <const>[x, ratings.filter(r => r[0].id === x.id).map(r => r[3])])
        .filter(x => x[1].length);
    const ratedSongs = songs
        .map(x => <const>[x, ratedSolos.filter(s => s[0].song === x.id)])
        .filter(s => s[1].length);
    const albumScores = albums.map(x => {
        const songArr = ratedSongs.filter(s => s[0].album === x.id);
        const soloArr = songArr.flatMap(s => s[1]);
        return <const>[x, songArr.length, soloArr.length, soloArr.flatMap(s => s[1])];
    }).filter(x => x[2]);
    const obj = {
        ...<Record<'artists' | 'years', any[]>>Object.fromEntries((<const>['artist', 'year']).map(k => [
            k + 's',
            [...new Set(albumScores.map(x => x[0][k]))].map(x => {
                const arr = albumScores.filter(a => a[0][k] === x);
                return <const>[
                    x + '',
                    arr.reduce((a, b) => a + b[1], 0),
                    arr.reduce((a, b) => a + b[2], 0),
                    ...getScore(arr.flatMap(a => a[3])),
                    arr.length,
                ];
            }),
        ])),
        guitarists: [...new Set(ratedSolos.flatMap(x => x[0].guitarists))].map(x => {
            const arr = ratedSolos.filter(s => s[0].guitarists.includes(x));
            return <const>[
                x,
                new Set(arr.map(s => getSolo(s[0].id, <Collections><unknown>[albums, songs, solos])[2].artist)).size,
                arr.length,
                ...getScore(arr.flatMap(s => s[1])),
            ];
        }),
        genres: [...new Set(ratedSongs.flatMap(x => x[0].genres))].map(x => {
            const songArr = ratedSongs.filter(s => s[0].genres.includes(x));
            const soloArr = songArr.flatMap(s => s[1]);
            return <const>[x, songArr.length, soloArr.length, ...getScore(soloArr.flatMap(s => s[1]))];
        }),
        tags: [...new Set(ratedSolos.flatMap(x => x[0].tags))].map(x => {
            const arr = ratedSolos.filter(s => s[0].tags.includes(x));
            return <const>[x, 0, arr.length, ...getScore(arr.flatMap(s => s[1]))];
        }),
    };
    return {
        total: [users.length, ratedSolos.length, ratedSongs.length, albumScores.length, obj.artists.length, obj.guitarists.length],
        averageDuration: ratedSolos.reduce((a, b) => a + b[0].end - b[0].start, 0) / ratedSolos.length,
        ratings: Array.from({ length: 11 }, (_, i) => [i, ratings.filter(x => x[3] === i).length]).filter(x => x[1]),
        albums: albumScores.map(x => <const>[x[0], x[1], x[2], ...getScore(x[3])]),
        ...obj,
    };
};
const search = <T>(arr: T[], q: string, f: (x: T) => string) => arr
    .map(x => <const>[x, compareTwoStrings(q, f(x).toLowerCase())])
    .filter(x => x[1] > SEARCH_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(x => x[0]);

export default (db: Database) => Router()
    .get('/albums/:id', async (req, res) => {
        const album = await db.get<Album>('albums', { id: req.params.id });
        if (!album) throw 'Album not found';
        const songs = await db.get<Song>('songs', { album: req.params.id }, true);
        const solos = (await db.get<Solo>('solos')).filter(x => songs.some(s => x.song === s.id));
        const ratings = (await db.get<User>('users')).flatMap(u => u.ratings.filter(x => solos.some(s => s.id === x.id)));
        res.json([
            album,
            songs,
            solos.length,
            ratings.reduce((a, b) => a + b.rating, 0) / ratings.length,
            ratings.length,
        ]);
    })
    .get('/songs/:id', async (req, res) => {
        const [albums, songs, solos, users] = await db.getCollections();
        const song = songs.find(x => x.id === req.params.id);
        if (!song) throw 'Song not found';
        res.json([
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
                        for (const x of u.ratings)
                            if (x.id !== s.id)
                                map[x.id] = (map[x.id] || 0) + x.rating * rating.rating;
                    }
                }
                return [
                    s,
                    resolveMap(map, RECOMMEND_COUNT, [albums, songs, solos, users]),
                    sum,
                    count,
                    req.user?.ratings.find(x => x.id === s.id)?.rating,
                ];
            }),
        ]);
    })
    .get('/random/:type', async (req, res) => {
        if (!['album', 'song', 'solo'].includes(req.params.type)) throw 'Type expected to be album, song or solo.';
        const id = (Math.floor(Math.random() * (await db.get<any>('data'))[0][req.params.type + 's']) + 1).toString(16);
        res.json(req.params.type === 'solo' ? { id: (await db.get<Solo>('solos', { id })).song, solo: id } : { id });
    })
    .get('/profile/:name', (req, res) => getProfile(db, req.params.name).then(d => res.json([d[0].name, d[0].description, d[1]])))
    .get('/profile/:name/stats', async (req, res) => res.json(getStats(
        applyFilters(loadFilters(<any>req.query), (await getProfile(db, req.params.name))[1]),
        await db.getCollections(),
    )))
    .get('/search', async (req, res) => {
        const query = (req.query.q + '').toLowerCase();
        const [albums, songs, solos] = await db.getCollections();
        const users = await db.getPublicUsers();
        const matches = <[Album[], Song[], User[]]>[albums, songs, users].map(arr => search(<any>arr, query, x => x.name));
        res.json([
            matches[0].map(x => [{}, {}, x]),
            matches[1].map(x => [{}, x, albums.find(y => y.id === x.album)]),
            matches[2].map(x => x.name),
            ...[albums.map(x => x.artist), solos.flatMap(x => x.guitarists), songs.flatMap(x => x.genres)]
                .map(arr => search([...new Set(arr)], query, x => x)),
        ]);
    })
    .get('/charts', async (_, res) => {
        const [albums, songs, solos, users] = await db.getCollections();
        res.json(solos.map(s => {
            const ratings = users.map(x => x.ratings.find(r => r.id === s.id)).filter(x => x);
            const song = songs.find(x => x.id === s.song)!;
            return [s, song, albums.find(x => x.id === song.album), ratings.reduce((a, b) => a + b!.rating, 0), ratings.length];
        }));
    })
    .get('/stats', async (req, res) => db.getCollections().then(d => res.json(getStats(
        applyFilters(loadFilters(<any>req.query), d[3].flatMap(x => getRatings(x, d))),
        d,
    ))));
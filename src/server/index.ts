import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import { config } from 'dotenv';

config();

import { Album, Song, User } from '../util';
import api, { db } from './api';
import { escapeQuotes } from './util';

const PORT = process.env.PORT || 2000;
const BASE_URL = process.env.BASE_URL!;

const html = readFileSync(join(process.cwd(), 'src/client/index.html'), 'utf8');

express()
    .use(express.json())
    .use('/api', api)
    .use(express.static(join(process.cwd(), 'build')))
    .use(express.static(join(process.cwd(), 'src/client/static')))
    .get('/sitemap.txt', async (_, res) => {
        const [albums, songs] = await db.getCollections();
        const users = await db.getPublicUsers();
        res.setHeader('content-type', 'text/plain; charset=UTF-8');
        res.send(['', 'add/album', 'guide', 'login', 'signup', 'settings', 'stats', 'discover', 'tierlist', ...albums.map(x => 'album/' + x.id), ...songs.map(x => 'song/' + x.id), ...users.map(x => 'profile/' + x.lowerName)].map(x => BASE_URL + x).join('\n'));
    })
    .get('*', async (req, res) => {
        let title = 'Page Not Found';
        let desc = '';
        let image = '';
        let type = 'website';
        const path = (req.url.match(/^[^?]+/)?.[0] || '/').split('/').slice(1);
        if (path[0] === 'album') {
            const album = await (await db.db).collection<Album>('albums').findOne({ id: path[1] });
            if (album) {
                title = `${album.name} - ${album.artist}`;
                desc = `View the album "${album.name}" by "${album.artist}", released in ${album.year}.`;
                if (!album.cover.startsWith('/')) image = album.cover;
                type = 'music:album';
            }
        } else if (path[0] === 'song') {
            const song = await (await db.db).collection<Song>('songs').findOne({ id: path[1] });
            if (song) {
                const album = (await (await db.db).collection<Album>('albums').findOne({ id: song.album }))!;
                title = `${song.name} - ${album.artist}`;
                desc = `View the song "${song.name}" by "${album.artist}" on the album "${album.name}".`;
                if (!album.cover.startsWith('/')) image = album.cover;
                type = 'music:song';
            }
        } else if (path[0] === 'profile') {
            const profile = await (await db.db).collection<User>('users').findOne({ lowerName: path[1].toLowerCase() });
            if (profile) {
                title = profile.name;
                desc = `View ${title}'s ratings and stats.`;
            }
        } else [title, desc] = path.length === 2
            ? path[0] === 'add' && path[1] === 'album'
                ? ['Add Album', 'Add an album.']
                : path[0] === 'search'
                    ? ['Search', '']
                    : [title, '']
            : path.length === 1
                ? path[0] === 'guide'
                    ? ['Guide and rules', '']
                    : path[0] === 'stats'
                        ? ['Stats', 'View statistics, and the highest rated albums and artists.']
                        : path[0] === 'discover'
                            ? ['Discover', '']
                            : path[0] === 'tierlist'
                                ? ['Tier List Generator', '']
                                : path[0] === 'settings'
                                    ? ['Account settings', '']
                                    : path[0] === 'login'
                                        ? ['Log in', '']
                                        : path[0] === 'signup'
                                            ? ['Sign up', '']
                                            : !path[0]
                                                ? ['Charts', 'View the highest rated guitar solos.']
                                                : [title, '']
                : [title, ''];
        desc = `${escapeQuotes(desc)}${desc ? ' ' : ''}Discover and rate guitar solos.`;
        res.send(html.replace('<!-- meta -->', () => `
            <title>${title} | Guitar Solos</title>
            <meta name="description" content="${desc}">
            <meta property="og:title" content="${escapeQuotes(title)} | Guitar Solos">
            <meta property="og:description" content="${desc}">
            <meta property="og:url" content="${BASE_URL}${req.url}">
            <meta property="og:type" content="${type}">
            ${image ? `<meta property="og:image" content="${image}">` : ''}
        `.split('\n').filter(x => x.trim()).map(x => x.slice(4)).join('\n')));
    })
    .listen(PORT, () => console.log('Listening on port', PORT));
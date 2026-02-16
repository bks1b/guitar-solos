import { join } from 'path';
import { readFileSync } from 'fs';
import express, { ErrorRequestHandler } from 'express';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import api from './api';
import meta from './meta';
import Database from './Database';

config({ quiet: true });

const db = new Database();

const html = readFileSync(join(process.cwd(), 'src/client/index.html'), 'utf8');

express()
    .use(express.json())
    .use(cookieParser())
    .use('/api', api(db))
    .use(express.static(join(process.cwd(), 'build')))
    .use(express.static(join(process.cwd(), 'src/client/static')))
    .get('/sitemap.txt', async (_, res) => {
        const data = await db.getCollections();
        res.setHeader('content-type', 'text/plain; charset=UTF-8');
        res.send([
            '', 'guide',
            'login', 'signup', 'settings',
            'add/album', 'stats', 'discover', 'tierlist',
            ...['album/', 'song/'].flatMap((p, i) => data[i].map(x => p + (<any>x).id)),
            ...(await db.getPublicUsers()).map(x => 'profile/' + x.name.toLowerCase()),
        ]
            .map(x => process.env.BASE_URL + x)
            .join('\n'));
    })
    .get('{/*path}', async (req, res) => res.send(html.replace(
        '<!-- meta -->',
        await meta(db, req.url, req.params.path || []),
    )))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .use(<ErrorRequestHandler>((err, _, res, __) => {
        console.error(err);
        res.status(500).json({ error: err + '' });
    }))
    .listen(process.env.PORT, () => console.log('Listening on port', process.env.PORT));
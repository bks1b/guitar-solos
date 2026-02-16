import { Response, Router } from 'express';
import { sign, verify } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import { ObjectId } from 'mongodb';
import Database, { resolveMap } from '../Database';
import { Rating, User } from '../../util';
import get from './get';
import post from './post';
import admin from './admin';

export const db = new Database();

const GENIUS_SEARCH = 'https://genius.com/api/search/album?page=1&q=';
const EXPIRY = '14d';
const DISCOVER_COUNT = 50;
const COMMON_WEIGHT = 0.7;

const omitUser = (p: User) => ({
    ...p,
    password: undefined,
    ratings: undefined,
    version: undefined,
});

const setToken = (res: Response, tok: Token) => res.cookie('token', sign(tok, process.env.JWT_SECRET!, { expiresIn: EXPIRY }), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
});

export default Router()
    .use(async (req, res, next) => {
        if (req.cookies.token) try {
            const tok = <Token>verify(req.cookies.token, process.env.JWT_SECRET!);
            const user = await db.get<User>('users', { _id: new ObjectId(tok._id) });
            if (user.version === tok.version) {
                req.user = user;
                setToken(res, tok);
            } else res.clearCookie('token');
        } catch {}
        next();
    })
    .use(get(db))
    .use('/auth', async (req, res) => {
        switch (req.method) {
            case 'DELETE':
                res.clearCookie('token');
                return res.json({});
            case 'PATCH':
                const user = await db.getUser(req.body.name);
                if (!user) throw 'User not found';
                if (!await compare(req.body.password, user.password)) throw 'Incorrect password';
                break;
            case 'POST':
                await db.add('users', await db.verifyUser(req.body));
                break;
            case 'PUT':
                if (!req.user) throw 'Not logged in';
                const obj = { ...req.user };
                Object.assign(obj, req.body);
                obj.version += +!await compare(obj.password, req.user.password);
                await db.set('users', { _id: req.user._id }, await db.verifyUser(obj, req.body.name !== req.user.name));
                break;
        }
        const ret = await db.getUser(req.body.name);
        setToken(res, { _id: ret._id + '', version: ret.version });
        res.json(omitUser(ret));
    })
    .use((req, res, next) => req.user ? next() : res.status(401).json({ error: 'Not logged in' }))
    .get('/me', (req, res) => res.json(omitUser(req.user!)))
    .use(post(db))
    .get('/discover', async (req, res) => {
        const users = (await db.get<User>('users')).filter(x => x.name !== req.user!.name);
        const map: Record<string, number> = {};
        for (const u of users) {
            let score = 0;
            let common = 0;
            const unknown: Rating[] = [];
            for (const x of u.ratings) {
                const other = req.user!.ratings.find(y => y.id === x.id);
                if (!other) unknown.push(x);
                else {
                    common++;
                    score += (x.rating + other.rating) / 2;
                }
            }
            if (common) for (const x of unknown)
                map[x.id] = (map[x.id] || 0) + score / common ** COMMON_WEIGHT * x.rating;
        }
        res.json(resolveMap(map, DISCOVER_COUNT, await db.getCollections()));
    })
    .get('/genius', (req, res) => fetch(GENIUS_SEARCH + req.query.q)
        .then(d => d.json())
        .then(d => res.json(d.response.sections[0].hits.map((x: any) => [
            x.result.name,
            x.result.artist.name,
            x.result.release_date_components?.year,
            (<string>x.result.cover_art_url)?.replace(/\.(\d+)x(\d+)/, (s, a, b) => a === b && +a >= 300 ? '.300x300' : s),
        ]))),
    )
    .use('/admin', admin(db));

type Token = { _id: string; version: number; };
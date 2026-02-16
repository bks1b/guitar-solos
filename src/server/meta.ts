import { Album, Song, User } from '../util';
import Database from './Database';

const escapeQuotes = (s: string) => s.replace(/"/g, '&quot;');

export default async (db: Database, url: string, path: string[]) => {
    let title = 'Page Not Found';
    let desc = '';
    let image = '';
    let type = 'website';
    if (path[0] === 'album' && path.length > 1) {
        const album = await db.get<Album>('albums', { id: path[1] });
        if (album) {
            title = `${album.name} - ${album.artist}`;
            desc = `View the album "${album.name}" by "${album.artist}", released in ${album.year}.`;
            if (!album.cover.startsWith('/')) image = album.cover;
            type = 'music:album';
        }
    } else if (path[0] === 'song' && path.length > 1) {
        const song = await db.get<Song>('songs', { id: path[1] });
        if (song) {
            const album = await db.get<Album>('albums', { id: song.album });
            title = `${song.name} - ${album.artist}`;
            desc = `View the song "${song.name}" by "${album.artist}" on the album "${album.name}".`;
            if (!album.cover.startsWith('/')) image = album.cover;
            type = 'music:song';
        }
    } else if (path[0] === 'profile' && path.length > 1) {
        const profile = await db.get<User>('users', { name: path[1].toLowerCase() });
        if (profile) {
            title = profile.name;
            desc = `View ${title}'s ratings and stats.`;
        }
    } else [title, desc] = (path.length === 2
        ? path[0] === 'add' && path[1] === 'album'
            ? ['Add Album', 'Add an album.']
            : path[0] === 'search' && ['Search', '']
        : path.length === 1
            ? {
                guide: ['Guide and rules', ''],
                stats: ['Stats', 'View statistics, and the highest rated albums and artists.'],
                discover: ['Discover', ''],
                tierlist: ['Tier List Generator', ''],
                settings: ['Account settings', ''],
                login: ['Log in', ''],
                signup: ['Sign up', ''],
            }[path[0]]
            : !path[0] && ['Charts', 'View the highest rated guitar solos.']) || [title, ''];
    desc = `${escapeQuotes(desc)}${desc ? ' ' : ''}Discover and rate guitar solos.`;
    return [
        `<title>${title} | Guitar Solos</title>`,
        `<meta name="description" content="${desc}">`,
        `<meta property="og:title" content="${escapeQuotes(title)} | Guitar Solos">`,
        `<meta property="og:description" content="${desc}">`,
        `<meta property="og:url" content="${process.env.BASE_URL + url.slice(1)}">`,
        `<meta property="og:type" content="${type}">`,
        ...image ? [`<meta property="og:image" content="${image}">`] : [],
    ].join('\n');
};
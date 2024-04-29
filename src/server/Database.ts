import fetch from 'node-fetch';
import { compareTwoStrings } from 'string-similarity';
import { Album, Auth, ExtendedAuth, Rating, Solo, Solos, Song, User, applyFilters, loadFilters } from '../util';
import { getScore, hash } from './util';
import DatabaseHandler from './DatabaseHandler';

export default class {
    db = new DatabaseHandler();

    private async getID(key: keyof Data, del = false) {
        const count = (await this.db.get<Data>('data'))![0][key];
        await this.db.set('data', {}, { [key]: count + (del ? -1 : 1) });
        return (count + (del ? 0 : 1)).toString(16);
    }

    private resolveMap(map: Record<string, number>, max: number, data: Collections) {
        return Object
            .entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, max)
            .map(x => this.getSolo(x[0], data));
    }

    private async getRatedUsers(id: string) {
        return (await this.db.get<User>('users')).filter(x => x.ratings.some(r => r.id === id));
    }

    getCollections() {
        return <Promise<Collections>>Promise.all(['albums', 'songs', 'solos', 'users'].map(x => this.db.get(x)));
    }

    getPublicUsers() {
        return this.db.get<User>('users', { public: true }, true);
    }

    async getCredentials(auth: ExtendedAuth, checkTaken = true) {
        if ([auth[0], auth[1]].some(x => x.trim().length < 3)) throw 'Usernames and passwords must be at least 3 characters long.';
        if ([auth[0], auth[1], auth[2]].some(x => x.trim().length > 100)) throw 'Usernames, passwords and descriptions must be at most 100 characters long.';
        if (!/^[a-z0-9_]+$/i.test(auth[0])) throw 'Usernames must only contain English letters, digits and underscores (_).';
        if (typeof auth[2] !== 'string') throw 'Description expected.';
        if (typeof auth[3] !== 'boolean') throw 'Profile publicness expected.';
        if (checkTaken && await this.getUser(auth[0])) throw 'Username taken.';
        return {
            name: auth[0].trim(),
            lowerName: auth[0].trim().toLowerCase(),
            password: hash(auth[1]),
            description: auth[2].trim(),
            public: auth[3],
        };
    }

    getUser(name: string) {
        return this.db.get<User>('users', { lowerName: name.toLowerCase() });
    }

    async addUser(auth: ExtendedAuth) {
        const obj = { ...await this.getCredentials(auth), ratings: [] };
        await this.db.add('users', obj);
        return obj;
    }

    editUser(auth: Auth, d: any) {
        return this.db.set('users', { lowerName: auth[0].toLowerCase(), password: hash(auth[1]) }, d);
    }

    async addAlbum(data: Omit<Album, 'id' | 'lowerName' | 'lowerArtist'>, admin?: boolean) {
        const lower = { lowerName: data.name.toLowerCase(), lowerArtist: data.artist.toLowerCase() };
        if (await this.db.get('albums', lower)) throw 'This album is already listed.';
        const id = await this.getID('albums');
        if (!admin) data.unverified = true;
        await this.db.add('albums', { ...data, id, ...lower });
        return { id };
    }
    
    async addSong(data: Omit<Song, 'id' | 'lowerName' | 'duration'>, admin?: boolean) {
        if (await this.db.get('songs', { lowerName: data.name.toLowerCase(), album: data.album })) throw 'This song is already listed on the album.';
        if (!await this.db.get('albums', { id: data.album })) throw 'Album not found.';
        const res = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${data.youtube}&key=${process.env.YOUTUBE_KEY}`, {
            headers: { accept: 'application/json' },
        }).then(d => d.json());
        if (!res.error && !res.items.length) throw 'YouTube video not found.';
        const id = await this.getID('songs');
        if (!admin) data.unverified = true;
        await this.db.add('songs', {
            ...data,
            id,
            lowerName: data.name.toLowerCase(),
            duration: res.error ? 0 : [...res.items[0].contentDetails.duration.matchAll(/(\d+)([HMS])/g)].reduce((a, b) => a + b[1] * 60 ** 'SMH'.indexOf(b[2]), 0),
        });
        return { id };
    }

    async addSolo(data: Omit<Solo, 'id'>, admin?: boolean) {
        if (!await this.db.get('songs', { id: data.song })) throw 'Song not found.';
        if (!admin) data.unverified = true;
        return this.db.add('solos', { ...data, id: await this.getID('solos') });
    }

    async getAlbum(id: string) {
        const album = await this.db.get<Album>('albums', { id });
        if (!album) throw 'Album not found.';
        const songs = await this.db.get<Song>('songs', { album: id }, true);
        const solos = (await this.db.get<Solo>('solos')).filter(x => songs.some(s => x.song === s.id));
        const ratings = (await this.db.get<User>('users')).flatMap(u => u.ratings.filter(x => solos.some(s => s.id === x.id)));
        return [album, songs, solos.length, ratings.reduce((a, b) => a + b.rating, 0) / ratings.length, ratings.length];
    }

    async getSong(id: string, user?: User) {
        const [albums, songs, solos, users] = await this.getCollections();
        const song = songs.find(x => x.id === id);
        if (!song) throw 'Song not found.';
        return [
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
                        for (const x of u.ratings.filter(r => r.id !== s.id)) map[x.id] = (map[x.id] || 0) + x.rating * rating.rating;
                    }
                }
                return [s, this.resolveMap(map, 5, [albums, songs, solos, users]), sum, count, user?.ratings.find(x => x.id === s.id)?.rating];
            }),
        ];
    }

    getSolo(id: string, [albums, songs, solos]: Collections) {
        const solo = solos.find(x => x.id === id)!;
        const song = songs.find(x => x.id === solo.song)!;
        return <const>[solo, song, albums.find(x => x.id === song.album)!];
    }

    async getProfile(name: string) {
        const user = await this.getUser(name);
        if (!user) throw 'User not found.';
        const data = await this.getCollections();
        return [user.name, user.description, user.ratings.map(x => [...this.getSolo(x.id, data), x.rating, 0] as Solos[number])] as const;
    }

    async getProfileStats(name: string, params: Record<string, any>) {
        return this.getStats(applyFilters(loadFilters(params), (await this.getProfile(name))[2]), await this.getCollections());
    }

    async discover(user: User) {
        const users = (await this.db.get<User>('users')).filter(x => x.name !== user.name);
        const map: Record<string, number> = {};
        for (const u of users) {
            let score = 0;
            let common = 0;
            const unknown: Rating[] = [];
            for (const x of u.ratings) {
                const other = user.ratings.find(y => y.id === x.id);
                if (!other) unknown.push(x);
                else {
                    common++;
                    score += (x.rating + other.rating) / 2;
                }
            }
            if (common) for (const x of unknown) {
                map[x.id] = (map[x.id] || 0) + score / common ** 0.7 * x.rating;
            }
        }
        return this.resolveMap(map, 50, await this.getCollections());
    }

    async search(str: string) {
        const [albums, songs, solos] = await this.getCollections();
        const users = await this.getPublicUsers();
        const matches = ([albums, songs, users] as unknown as { lowerName: string; }[][]).map(arr => arr
            .map(x => [x, compareTwoStrings(str.toLowerCase(), x.lowerName)] as const)
            .filter(x => x[1] > 0.25)
            .sort((a, b) => b[1] - a[1])
            .map(x => x[0])) as [Album[], Song[], User[]];
        return [
            matches[0].map(x => [{}, {}, x]),
            matches[1].map(x => [{}, x, albums.find(y => y.id === x.album)]),
            matches[2].map(x => x.name),
            ...[albums.map(x => x.artist), solos.flatMap(x => x.guitarists), songs.flatMap(x => x.genres)].map(arr => [...new Set(arr)]
                .map(x => [x, compareTwoStrings(str.toLowerCase(), x.toLowerCase())] as const)
                .filter(x => x[1] > 0.25)
                .sort((a, b) => b[1] - a[1])
                .map(x => x[0]),
            ),
        ];
    }

    async getCharts() {
        const [albums, songs, solos, users] = await this.getCollections();
        return solos.map(s => {
            const ratings = users.map(x => x.ratings.find(r => r.id === s.id)).filter(x => x);
            const song = songs.find(x => x.id === s.song)!;
            return [s, song, albums.find(x => x.id === song.album), ratings.reduce((a, b) => a + b!.rating, 0), ratings.length];
        });
    }

    getStats(ratings: Solos, [albums, songs, solos, users]: Collections) {
        const ratedSolos = solos.map(x => <const>[x, ratings.filter(r => r[0].id === x.id).map(r => r[3])]).filter(x => x[1].length);
        const ratedSongs = songs.map(x => <const>[x, ratedSolos.filter(s => s[0].song === x.id)]).filter(s => s[1].length);
        const albumScores = albums.map(x => {
            const songArr = ratedSongs.filter(s => s[0].album === x.id);
            const soloArr = songArr.flatMap(s => s[1]);
            return <const>[x, songArr.length, soloArr.length, soloArr.flatMap(s => s[1])];
        }).filter(x => x[2]);
        const obj = {
            ...<Record<'artists' | 'years', any[]>>Object.fromEntries((<const>['artist', 'year']).map(k => [k + 's', [...new Set(albumScores.map(x => x[0][k]))].map(x => {
                const arr = albumScores.filter(a => a[0][k] === x);
                return <const>[x + '', arr.reduce((a, b) => a + b[1], 0), arr.reduce((a, b) => a + b[2], 0), ...getScore(arr.flatMap(a => a[3])), arr.length];
            })])),
            guitarists: [...new Set(ratedSolos.flatMap(x => x[0].guitarists))].map(x => {
                const arr = ratedSolos.filter(s => s[0].guitarists.includes(x));
                return <const>[
                    x,
                    new Set(arr.map(s => this.getSolo(s[0].id, <Collections><unknown>[albums, songs, solos])[2].artist)).size,
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
    }

    async getTotalStats(params: Record<string, any>) {
        const data = await this.getCollections();
        return this.getStats(applyFilters(loadFilters(params), <Solos>data[3].flatMap(x => x.ratings.map(r => [...this.getSolo(r.id, data), r.rating]))), data);
    }

    edit(entry: string[], data: any) {
        return this.db.set(entry[0], { id: entry[1] }, data);
    }

    verify(entry: string[]) {
        return this.db.set(entry[0], { id: entry[1] }, {}, ['unverified']);
    }

    async getAdminData() {
        const [albums, songs, solos] = await this.getCollections();
        return {
            unverified: [
                albums.filter(x => x.unverified),
                songs.filter(x => x.unverified).map(x => [x, albums.find(a => a.id === x.album)]),
                solos.filter(x => x.unverified).map(x => this.getSolo(x.id, <Collections><unknown>[albums, songs, solos])),
            ],
            ...Object.fromEntries((<const>['guitarists', 'tags']).map(k => [k, [...new Set(solos.filter(x => !x[k].length).map(x => x.song))].map(x => {
                const song = songs.find(s => s.id === x)!;
                return [song, albums.find(a => a.id === song.album)];
            })])),
        };
    }

    async deleteAlbum(id: string) {
        const songs = await this.db.get<Song>('songs', { album: id }, true);
        for (const s of songs) await this.deleteSong(s.id);
        await this.db.delete('albums', { id });
        const latestID = await this.getID('albums', true);
        if (id !== latestID) {
            await this.db.set('albums', { id: latestID }, { id });
            await this.db.set('songs', { album: latestID }, { album: id });
        }
    }

    async deleteSong(id: string) {
        const solos = await this.db.get<Solo>('solos', { song: id }, true);
        for (const s of solos) await this.deleteSolo(s.id);
        await this.db.delete('songs', { id });
        const latestID = await this.getID('songs', true);
        if (id !== latestID) {
            await this.db.set('songs', { id: latestID }, { id });
            await this.db.set('solos', { song: latestID }, { song: id });
        }
    }

    async deleteSolo(id: string) {
        for (const u of await this.getRatedUsers(id)) await this.db.set('users', { name: u.name }, { ratings: u.ratings.filter(r => r.id !== id) });
        await this.db.delete('solos', { id });
        const latestID = await this.getID('solos', true);
        if (id !== latestID) {
            await this.db.set('solos', { id: latestID }, { id });
            for (const u of await this.getRatedUsers(latestID)) await this.db.set('users', { name: u.name }, { ratings: u.ratings.map(r => r.id === latestID ? { ...r, id } : r) });
        }
    }
}

type Data = Record<'albums' | 'songs' | 'solos', number>;
type Collections = [Album[], Song[], Solo[], User[]];
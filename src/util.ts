export const loadFilters = (params: Record<string, string>): Filters => ([
    ['artists', x => [x[2].artist], false],
    ['guitarists', x => x[0].guitarists, true],
    ['genres', x => x[1].genres, true],
    ['years', x => [x[2].year + ''], false],
] as [string, (x: Solos[number]) => string[], boolean][]).map(x => [...x, params[x[0]]?.toLowerCase().split(';') || [], params[x[0] + '_mode'] === 'all']);
export const applyFilters = (arr: Filters, solos: Solos) => solos.filter(x => arr.every(y => {
    const arr = y[1](x as any).map(s => s.toLowerCase());
    const [include, exclude] = y[3].reduce((a, b) => b.startsWith('%') ? [a[0], [...a[1], b.slice(1)]] : [[...a[0], b], a[1]], [[], []] as string[][]);
    return (!include.length || include[y[4] ? 'every' : 'some'](s => arr.includes(s))) && exclude.every(s => !arr.includes(s));
}));

export type Rating = {
    id: string;
    rating: number;
};
export type User = {
    name: string;
    lowerName: string;
    password: string;
    ratings: Rating[];
    description: string;
    public: boolean;
    admin?: boolean;
};
export type Album = {
    id: string;
    name: string;
    artist: string;
    lowerName: string;
    lowerArtist: string;
    year: number;
    cover: string;
    unverified?: boolean;
};
export type Song = {
    id: string;
    album: string;
    name: string;
    lowerName: string;
    genres: string[];
    youtube: string;
    unverified?: boolean;
};
export type Solo = {
    id: string;
    song: string;
    start: number;
    end: number;
    guitarists: string[];
    unverified?: boolean;
};

export type Auth = [string, string];
export type ExtendedAuth = [...Auth, string, boolean];

export type Solos = [Solo, Song, Album, number, number][];
export type Filters = [string, (x: Solos[number]) => string[], boolean, string[], boolean][];
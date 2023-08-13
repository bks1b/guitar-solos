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

export type Data = Record<'albums' | 'songs' | 'solos', number>;

export type Auth = [string, string];
export type ExtendedAuth = [...Auth, string, boolean];
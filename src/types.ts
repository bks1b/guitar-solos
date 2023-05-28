export type Rating = {
    id: string;
    rating: number;
};

export type User = {
    name: string;
    lowerName: string;
    password: string;
    ratings: Rating[];
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
    unverified?: boolean;
};

export type Data = Record<'albums' | 'songs' | 'solos', number>;
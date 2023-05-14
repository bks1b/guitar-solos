export type Rating = {
    id: string;
    rating: number;
};

export type User = {
    name: string;
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
};

export type Song = {
    id: string;
    album: string;
    name: string;
    lowerName: string;
    genres: string[];
    youtube: string;
};

export type Solo = {
    id: string;
    song: string;
    start: number;
    end: number;
};

export type Data = Record<'albums' | 'songs' | 'solos', number>;
import { createContext, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { Album, Auth, Solo, Song, User } from '../types';

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export const orderBy = ['ascending', 'descending'];

export const MainContext = createContext<Ctx | null>(null);

export const resolvePath = (arr: string[], q?: string[][]) => '/' + arr.map(x => encodeURIComponent(x)).join('/') + (q?.length ? '?' + new URLSearchParams(q) : '');
export const resolveParams = (arr: string[][]) => window.location.pathname + (arr.length ? '?' + new URLSearchParams(Object.fromEntries(arr)) : '');
export const updateParams = (arr: string[][]) => {
    const path = resolveParams(arr);
    if (window.location.pathname + window.location.search !== path) window.history.pushState('', '', path);
};

export const onClick = (f: (mid: boolean) => any) => {
    let isTarget = false;
    return {
        onMouseDown: (e: MouseEvent) => {
            e.preventDefault();
            isTarget = true;
        },
        onMouseOut: () => isTarget = false,
        onMouseUp: (e: MouseEvent) => {
            if (isTarget && [0, 1].includes(e.button)) f(e.button === 1);
            isTarget = false;
        },
    };
};
export const enterKeydown = (f: () => any) => ({ onKeyDown: (e: KeyboardEvent) => e.key === 'Enter' && f() });

export const toFixed = (n: number) => +n.toFixed(1);
export const getSecs = (m: RefObject<HTMLInputElement>, s: RefObject<HTMLInputElement>) => {
    if ([m, s].some(x => !x.current!.value)) throw 'Timestamp expected.';
    if ([m, s].some(x => +x.current!.value < 0)) throw 'Timestamps expected to be nonnegative.';
    if (+s.current!.value > 59) throw 'Seconds expected to be between 0 and 59 (inclusive).';
    return +m.current!.value * 60 + +s.current!.value;
};
export const getTimestamp = (s: number) => `${Math.floor(s / 60)}:${(s % 60 + '').padStart(2, '0')}`;

export const genius = <a href='https://genius.com/' target='_blank'>Genius</a>;

type Ctx = {
    loggedIn: boolean;
    admin: boolean;
    request: RequestFn;
    navigate: (arr: string[], q?: string[][]) => void;
    navigateOnClick: (arr: string[], q?: string[][]) => {};
    user: AuthState;
    setUser: (x: AuthState) => any;
};
export type RequestFn = <T>(str: string, body: Record<string, any> | null, cb: (x: T) => any, err?: (x: string) => any) => Promise<any>;
export type AuthState = { loggedIn: boolean; auth?: Auth; } & { [k in Exclude<keyof User, 'password' | 'ratings'>]?: User[k]; };
export type Solos = [Solo, Song, Album, number, number][];
export type RatingStatsType = {
    ratings: number[][];
    albums: [Album, number, number, number, number, number][];
}
    & Record<'guitarists' | 'genres', [string, number, number, number, number, number][]>
    & Record<'artists' | 'years', [string, number, number, number, number, number, number][]>;
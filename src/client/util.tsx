import { createContext, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { Album, Solo, Song } from '../types';

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export const orderBy = ['ascending', 'descending'];

export const MainContext = createContext<Ctx | null>(null);

export const resolvePath = (arr: string[], q?: string[][]) => '/' + arr.map(x => encodeURIComponent(x)).join('/') + (q?.length ? '?' + new URLSearchParams(q) : '');
export const resolveParams = (arr: string[][]) => window.location.pathname + (arr.length ? '?' + new URLSearchParams(Object.fromEntries(arr)) : '');
export const updateParams = (arr: string[][]) => {
    const path = resolveParams(arr);
    if (window.location.pathname + window.location.search !== path) window.history.pushState('', '', path);
};

export const onClick = (left: () => any, middle: () => any = left) => {
    let isTarget = false;
    return {
        onMouseDown: (e: MouseEvent) => {
            e.preventDefault();
            isTarget = true;
        },
        onMouseOut: () => isTarget = false,
        onMouseUp: (e: MouseEvent) => {
            if (isTarget) [left, middle][e.button]?.();
            isTarget = false;
        },
    };
};
export const enterKeydown = (f: () => any) => ({ onKeyDown: (e: KeyboardEvent) => e.key === 'Enter' && f() });

export const toFixed = (n: number) => +n.toFixed(1);
export const getSecs = (m: RefObject<HTMLInputElement>, s: RefObject<HTMLInputElement>) => +m.current!.value * 60 + +s.current!.value;
export const getTimestamp = (s: number) => `${Math.floor(s / 60)}:${(s % 60 + '').padStart(2, '0')}`;

export const genius = <a href='https://genius.com/' target='_blank'>Genius</a>;

type Ctx = {
    loggedIn: boolean;
    admin: boolean;
    request: RequestFn;
    navigate: (arr: string[], q?: string[][]) => void;
    navigateOnClick: (arr: string[], q?: string[][]) => {};
};
export type RequestFn = <T>(str: string, body: Record<string, any> | null, cb: (x: T) => any, err?: (x: string) => any) => Promise<any>;
export type Solos = [Solo, Song, Album, number, number][];
export type RatingStatsType = {
    ratings: number[][];
    albums: [Album, number, number, number, number, number][];
}
    & Record<'guitarists' | 'genres', [string, number, number, number, number, number][]>
    & Record<'artists' | 'years', [string, number, number, number, number, number, number][]>;
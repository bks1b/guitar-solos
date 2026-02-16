import { KeyboardEvent, MouseEvent, RefObject, createContext } from 'react';
import { Album, User } from '../util';

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export const orderBy = ['ascending', 'descending'];
export const completeKeys = ['album', 'bonus'] as const;

export const MainContext = createContext<{
    navigate: (arr: string[], q?: string[][]) => void;
    navigateOnClick: (arr: string[], q?: string[][]) => any;
    user?: User;
    setUser: (x: User) => any;
        } | null>(null);

export const request = <T,>(str: string, method = 'GET', body?: any, err = alert) =>
    fetch('/api/' + str + (method === 'GET' && body ? '?' + new URLSearchParams(body) : ''), {
        method,
        headers: { 'content-type': 'application/json' },
        body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    }).then(async d => {
        const r = await d.json();
        if (d.status === 200) return r as T;
        err(r.error || JSON.stringify(r));
        throw r;
    });

export const resolvePath = (arr: string[], q?: string[][]) =>
    '/' + arr.map(x => encodeURIComponent(x)).join('/') + (q?.length ? '?' + new URLSearchParams(q) : '');
export const resolveParams = (arr: string[][]) =>
    window.location.pathname + (arr.length ? '?' + new URLSearchParams(Object.fromEntries(arr)) : '');
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
export const getSecs = (m: RefObject<HTMLInputElement | null>, s: RefObject<HTMLInputElement | null>) => {
    if ([m, s].some(x => !x.current!.value)) throw 'Timestamp expected';
    if ([m, s].some(x => +x.current!.value < 0)) throw 'Timestamps expected to be nonnegative';
    if (+s.current!.value > 59) throw 'Seconds expected to be between 0 and 59 (inclusive)';
    return +m.current!.value * 60 + +s.current!.value;
};
export const parseTimestamp = (s: string) => s.split(':').reduce((a, b, i) => a + +b * 60 ** (1 - i), 0);
export const getTimestamp = (s: number) => `${Math.floor(s / 60)}:${(s % 60 + '').padStart(2, '0')}`;

export const noSolos = <h2>No solos match the given filters.</h2>;
export const genius = <a href='https://genius.com/' target='_blank'>Genius</a>;

export type StatsType = {
    total: number[];
    averageDuration: number;
    ratings: number[][];
    albums: [Album, number, number, number, number, number][];
}
    & Record<'guitarists' | 'genres' | 'tags', [string, number, number, number, number, number][]>
    & Record<'artists' | 'years', [string, number, number, number, number, number, number][]>;
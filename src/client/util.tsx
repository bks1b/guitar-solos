import { createContext, RefObject } from 'react';
import { Album, Solo, Song } from '../types';

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const MainContext = createContext<Ctx | null>(null);

export const updateParams = (arr: string[][]) => {
    const path = window.location.pathname + (arr.length ? '?' + new URLSearchParams(Object.fromEntries(arr)) : '');
    if (window.location.pathname + window.location.search !== path) window.history.pushState('', '', path);
};

export const toFixed = (n: number) => +n.toFixed(1);
export const getSecs = (m: RefObject<HTMLInputElement>, s: RefObject<HTMLInputElement>) => +m.current!.value * 60 + +s.current!.value;
export const getTimestamp = (s: number) => `${Math.floor(s / 60)}:${(s % 60 + '').padStart(2, '0')}`;

type Ctx = {
    loggedIn: boolean;
    admin: boolean;
    request: RequestFn;
    navigate: (x: string[], q?: string[][]) => void;
};
export type RequestFn = <T>(str: string, body: any, cb: (x: T) => any, err?: (x: string) => any) => Promise<any>;
export type Solos = [Solo, Song, Album, number][];
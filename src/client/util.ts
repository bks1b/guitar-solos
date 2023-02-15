import { createContext, MutableRefObject } from 'react';
import { Album, Solo, Song } from '../types';

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const MainContext = createContext<Ctx>(null);

export const getSecs = (m: MutableRefObject<HTMLInputElement>, s: MutableRefObject<HTMLInputElement>) => +m.current!.value * 60 + +s.current!.value;
export const getTimestamp = (s: number) => `${Math.floor(s / 60)}:${(s % 60 + '').padStart(2, '0')}`;

type Ctx = {
    loggedIn: boolean;
    request: RequestFn;
    navigate: (x: string[], q?: string[][]) => void;
};
export type RequestFn = <T>(str: string, body: any, cb: (x: T) => any, err?: (x: string) => any) => Promise<any>;
export type Solos = [Solo, Song, Album, number][];
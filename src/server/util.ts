import { createHash } from 'crypto';

export const hash = (str: string) => createHash('sha256').update(str).digest('hex');

export const getScore = (arr: number[]) => {
    if (!arr.length) return [0, 0, 0];
    const sum = arr.reduce((a, b) => a + b, 0);
    return [sum / arr.length ** 0.6, sum / arr.length, arr.length];
};

export const getRatings = (arr: number[]) => Array.from({ length: 11 }, (_, i) => [i, arr.filter(x => x === i).length]).filter(x => x[1]);

export const escapeQuotes = (s: string) => s.replace(/"/g, '&quot;');
import { useContext, useEffect, useState } from 'react';
import { MainContext, RatingStatsType, getTimestamp, toFixed } from '../util';
import RatingStats from '../components/RatingStats';

const keys = ['solo', 'song', 'album', 'artist', 'guitarist'];

export default () => {
    const { request } = useContext(MainContext)!;
    const [data, setData] = useState<Stats>();
    useEffect(() => {
        document.title = 'Stats | Guitar Solos';
        request<Stats>('/stats', null, x => setData(x));
    }, []);
    return data
        ? <>
            <h1>Info</h1>
            <a href='https://github.com/bks1b/guitar-solos' target='_blank'>Source code</a>
            <h1>Stats</h1>
            <a>Total:</a>
            <ul>{['user', ...keys].map((x, i) => <li key={i}>{data.total[i]} {x}s</li>)}</ul>
            <a>Average:</a>
            <ul>
                {keys.slice(0, -2).flatMap((a, i) => keys.slice(i + 1, -1).map((b, j) => <li key={`${i},${j}`}>{toFixed(data.total[i + 1] / data.total[j + i + 2])} {a}s per {b}</li>))}
                <li>{toFixed(data.ratings.reduce((a, b) => a + b[1], 0) / data.total[0])} solos rated per user</li>
            </ul>
            <a>Average solo duration: {getTimestamp(Math.round(data.averageDuration))}</a>
            <RatingStats data={data}/>
        </>
        : <></>;
};

type Stats = {
    total: number[];
    averageDuration: number;
} & RatingStatsType;
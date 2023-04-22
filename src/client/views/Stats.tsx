import { useContext, useEffect, useState } from 'react';
import { MainContext, getTimestamp, toFixed } from '../util';
import RatingTable from '../components/RatingTable';
import { Album } from '../../types';

const keys = ['solo', 'song', 'album', 'artist'];

export default () => {
    const { request, navigate } = useContext(MainContext)!;
    const [data, setData] = useState<Stats>();
    useEffect(() => {
        document.title = 'Stats | Guitar Solos';
        request<Stats>('/stats', {}, x => setData(x));
    }, []);
    return data
        ? <>
            <h1>Stats</h1>
            <a>Total:</a>
            <ul>{['user', ...keys].map((x, i) => <li key={i}>{data.total[i]} {x}s</li>)}</ul>
            <a>Average:</a>
            <ul>
                {keys.slice(0, -1).flatMap((a, i) => keys.slice(i + 1).map((b, j) => <li key={`${i},${j}`}>{toFixed(data.total[i + 1] / data.total[j + i + 2])} {a}s per {b}</li>))}
                <li>{toFixed(data.ratings.reduce((a, b) => a + b[1], 0) / data.total[0])} solos rated per user</li>
            </ul>
            <a>Average solo duration: {getTimestamp(Math.round(data.averageDuration))}</a>
            <RatingTable data={data.ratings}/>
            <h1>Highest rated albums</h1>
            {data.albums.map((x, i) => <div key={i} className='albumInfo chart'>
                <h2>{i + 1}.</h2>
                <img src={x[0].cover} className='link' onClick={() => navigate(['album', x[0].id])}/>
                <div>
                    <h2 className='link' onClick={() => navigate(['album', x[0].id])}>{x[0].name}</h2>
                    <h2 className='link' onClick={() => navigate([], [['artists', x[0].artist.toLowerCase()]])}>{x[0].artist}</h2>
                    <a>{x[1]} songs, {x[2]} solos</a>
                    <br/>
                    <a>{toFixed(x[4])}/10 average rating, {x[5]} total ratings</a>
                </div>
            </div>)}
            <h1>Highest rated artists</h1>
            {data.artists.map((x, i) => <div key={i}>
                <h3>{i + 1}. <a className='link' onClick={() => navigate([], [['artists', x[0].toLowerCase()]])}>{x[0]}</a></h3>
                <ul>
                    <li>{x[6]} albums, {x[1]} songs, {x[2]} solos</li>
                    <li>{toFixed(x[4])}/10 average rating, {x[5]} total ratings</li>
                </ul>
            </div>)}
        </>
        : <></>;
};

type Stats = {
    total: number[];
    ratings: number[][];
    averageDuration: number;
    albums: [Album, number, number, number, number, number][];
    artists: [string, number, number, number, number, number, number][];
};
import { useContext, useEffect, useState } from 'react';
import { MainContext , getTimestamp } from '../util';
import { Album, Solo, Song } from '../../types';
import AdminSongs from '../components/AdminSongs';

export default () => {
    const { request, navigate } = useContext(MainContext)!;
    const [data, setData] = useState<Data>();
    useEffect(() => {
        document.title = 'Admin | Guitar Solos';
        request<Data>('/admin/data', {}, x => setData(x));
    }, []);
    return data
        ? <>
            <button onClick={() => request('/admin/backup', {}, d => {
                const a = document.createElement('a');
                a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(d));
                a.download = 'solos.json';
                a.click();
            })}>Download backup</button>
            {data.unverified.some(x => x.length) ? <h1>Unverified entries</h1> : ''}
            {data.unverified[0].length ? <h2>Albums</h2> : ''}
            {
                data.unverified[0].map((x, i) => <div key={i} className='adminAlbum'>
                    <img src={x.cover}/>
                    <div onClick={() => navigate(['album', x.id])} className='link'>{x.name} <a className='label'>by</a> {x.artist}</div>
                </div>)
            }
            {data.unverified[1].length ? <h2>Songs</h2> : ''}
            <AdminSongs arr={data.unverified[1]}/>
            {data.unverified[2].length ? <h2>Solos</h2> : ''}
            {
                data.unverified[2].map((x, i) => <div key={i} onClick={() => navigate(['song', x[1].id])} className='link'>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)} <a className='label'>on</a> {x[1].name} <a className='label'>by</a> {x[2].artist}</div>)
            }
            {data.noGuitarists.length ? <h1>Songs with solos without guitarists</h1> : ''}
            <AdminSongs arr={data.noGuitarists}/>
        </>
        : <></>;
};

type Data = {
    unverified: [Album[], [Song, Album][], [Solo, Song, Album][]];
    noGuitarists: [Song, Album][];
};
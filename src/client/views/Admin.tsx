import { useContext, useEffect, useState } from 'react';
import { MainContext , getTimestamp } from '../util';
import { Album, Solo, Song } from '../../util';
import AdminSongs from '../components/AdminSongs';

export default () => {
    const { request, navigateOnClick } = useContext(MainContext)!;
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
            {data.unverified[0].length ? <h1>Unverified albums</h1> : ''}
            {
                data.unverified[0].map((x, i) => <div key={i} className='adminAlbum'>
                    <img src={x.cover}/>
                    <div {...navigateOnClick(['album', x.id])} className='link'>{x.name} <a className='label'>by</a> {x.artist}</div>
                </div>)
            }
            {data.unverified[1].length ? <h1>Unverified songs</h1> : ''}
            <AdminSongs arr={data.unverified[1]}/>
            {data.unverified[2].length ? <h1>Unverified solos</h1> : ''}
            {data.unverified[2].map((x, i) => <div key={i} {...navigateOnClick(['song', x[1].id], [['solo', x[0].id]])} className='link'>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)} <a className='label'>on</a> {x[1].name} <a className='label'>by</a> {x[2].artist}</div>)}
            {(['guitarists', 'tags'] as const).map(k => data[k].length ? <div key={k}><h1>Songs with solos without {k}</h1><AdminSongs arr={data[k]}/></div> : '')}
        </>
        : <></>;
};

type Data = { unverified: [Album[], [Song, Album][], [Solo, Song, Album][]]; } & Record<'guitarists' | 'tags', [Song, Album][]>;
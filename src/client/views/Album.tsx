import { useContext, useEffect, useRef, useState } from 'react';
import { Album, Song } from '../../types';
import { MainContext } from '../util';

export default ({ id }: { id: string; }) => {
    const { request, navigate, loggedIn, admin } = useContext(MainContext)!;
    const [reload, setReload] = useState(0);
    const [album, setAlbum] = useState<[Album, Song[]]>();
    const name = useRef<HTMLInputElement>(null);
    const genres = useRef<HTMLInputElement>(null);
    const yt = useRef<HTMLInputElement>(null);
    const edit = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        request<[Album, Song[]]>('/get/album', { id }, x => setAlbum(x));
    }, [reload]);
    useEffect(() => {
        if (album) document.title = `${album[0].name} - ${album[0].artist} | Guitar Solos`;
    }, [album]);
    return album
        ? <>
            <div className='albumInfo'>
                <img src={album[0].cover}/>
                <div>
                    <h1>{album[0].name}</h1>
                    <h2><a className='label'>by</a> <a className='link' onClick={() => navigate([], [['artists', album[0].artist.toLowerCase()]])}>{album[0].artist}</a></h2>
                </div>
            </div>
            <a>Released in: <a className='link' onClick={() => navigate([], [['year', album[0].year + '']])}>{album[0].year}</a></a>
            {
                admin
                    ? <>
                        <br/>
                        <textarea defaultValue={JSON.stringify({
                            name: album[0].name,
                            artist: album[0].artist,
                            year: album[0].year,
                            cover: album[0].cover,
                        }, undefined, 4)} ref={edit}/>
                        <div className='row'>
                            <button onClick={() => {
                                const d = JSON.parse(edit.current!.value);
                                request('/admin/edit', { entry: ['albums', album[0].id], data: { ...d, lowerName: d.name.toLowerCase(), lowerArtist: d.artist.toLowerCase() } }, () => setReload(reload + 1));
                            }}>Edit</button>
                            <button onClick={() => request('/admin/delete/album', { id: album[0].id }, () => setReload(reload + 1))}>Delete</button>
                        </div>
                    </>
                    : ''
            }
            {
                album[1].length
                    ? <>
                        <hr/>
                        {album[1].map((x, i) => <h2 key={i} onClick={() => navigate(['song', x.id])} className='link'>{x.name}</h2>)}
                    </>
                    : ''
            }
            {
                loggedIn
                    ? <>
                        <hr/>
                        <h1>Add song</h1>
                        <label>Name: <input ref={name}/></label>
                        <br/>
                        <label>Genres: <input ref={genres} placeholder='Separated by ,'/></label>
                        <br/>
                        <label>YouTube ID: <input ref={yt}/> (high quality, no music videos, preferably official audio)</label>
                        <br/>
                        <button onClick={() => request<{ id: string; }>('/add/song', {
                            name: name.current!.value,
                            album: id,
                            genres: genres.current!.value.split(','),
                            youtube: yt.current!.value,
                        }, d => navigate(['song', d.id]))}>Add</button>
                    </>
                    : ''
            }
        </>
        : <></>;
};
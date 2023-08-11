import { useContext, useEffect, useRef, useState } from 'react';
import { Album, Song } from '../../types';
import { MainContext, enterKeydown } from '../util';
import AuthText from '../components/AuthText';

export default ({ id }: { id: string; }) => {
    const { request, navigate, navigateOnClick, loggedIn, admin } = useContext(MainContext)!;
    const [reload, setReload] = useState(0);
    const [album, setAlbum] = useState<[Album, Song[]]>();
    const name = useRef<HTMLInputElement>(null);
    const genres = useRef<HTMLInputElement>(null);
    const yt = useRef<HTMLInputElement>(null);
    const edit = useRef<HTMLTextAreaElement>(null);
    const submit = () => request<{ id: string; }>('/add/song', {
        name: name.current!.value,
        album: id,
        genres: genres.current!.value.split(','),
        youtube: yt.current!.value,
    }, d => navigate(['song', d.id]));
    useEffect(() => {
        request<[Album, Song[]]>('/get/album?id=' + id, null, x => setAlbum(x));
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
                    <h2><a className='label'>by</a> <a className='link' {...navigateOnClick([], [['artists', album[0].artist.toLowerCase()]])}>{album[0].artist}</a></h2>
                </div>
            </div>
            <a>Released in: <a className='link' {...navigateOnClick([], [['years', album[0].year + '']])}>{album[0].year}</a></a>
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
                            <button onClick={() => confirm('Are you sure?') && request('/admin/delete/album', { id: album[0].id }, () => setReload(reload + 1))}>Delete</button>
                            {
                                album[0].unverified
                                    ? <button onClick={() => request('/admin/verify', { entry: ['albums', album[0].id] }, () => setReload(reload + 1))}>Verify</button>
                                    : ''
                            }
                        </div>
                    </>
                    : ''
            }
            {
                album[1].length
                    ? <>
                        <hr/>
                        {album[1].map((x, i) => <h2 key={i} {...navigateOnClick(['song', x.id])} className='link'>{x.name}</h2>)}
                    </>
                    : ''
            }
            <hr/>
            {
                loggedIn
                    ? <>
                        <h1>Add song</h1>
                        <label>Name: <input ref={name} {...enterKeydown(submit)}/></label>
                        <br/>
                        <label>Genres: <input ref={genres} placeholder='Separated by ,' {...enterKeydown(submit)}/></label>
                        <br/>
                        <label>YouTube URL or ID: <input ref={yt} {...enterKeydown(submit)}/></label>
                        <br/>
                        <button onClick={submit}>Add</button>
                    </>
                    : <AuthText text='add songs to this album'/>
            }
        </>
        : <></>;
};
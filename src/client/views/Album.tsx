import { useContext, useEffect, useRef, useState } from 'react';
import { Album, Song } from '../../types';
import { MainContext } from '../util';

export default ({ id }: { id: string; }) => {
    const { request, navigate, loggedIn } = useContext(MainContext);
    const [reload] = useState(0);
    const [album, setAlbum] = useState<[Album, Song[]]>();
    const name = useRef<HTMLInputElement>();
    const genres = useRef<HTMLInputElement>();
    const yt = useRef<HTMLInputElement>();
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
            <a>Released in: {album[0].year}</a>
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
                        <label>Genres (seperated by commas): <input ref={genres}/></label>
                        <br/>
                        <label>YouTube ID (official audio): <input ref={yt}/></label>
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
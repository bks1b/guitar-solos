import { useContext, useEffect, useRef, useState } from 'react';
import { Album, Song } from '../../util';
import { MainContext, completeKeys, enterKeydown, request, toFixed } from '../util';
import AuthText from '../components/AuthText';

export default ({ id }: { id: string; }) => {
    const { navigate, navigateOnClick, user } = useContext(MainContext)!;
    const [reload, setReload] = useState(0);
    const [album, setAlbum] = useState<Data>();
    const [error, setError] = useState(false);
    const name = useRef<HTMLInputElement>(null);
    const genres = useRef<HTMLInputElement>(null);
    const yt = useRef<HTMLInputElement>(null);
    const edit = useRef<HTMLTextAreaElement>(null);
    const inc = () => setReload(reload + 1);
    const submit = () => request<{ id: string; }>('songs', 'POST', {
        name: name.current!.value,
        album: id,
        genres: genres.current!.value.split(','),
        youtube: yt.current!.value,
    }).then(d => navigate(['song', d.id]));
    useEffect(() => {
        request<Data>('albums/' + id, 'GET', undefined, () => setError(true)).then(setAlbum);
    }, [reload]);
    useEffect(() => {
        if (album) document.title = `${album[0].name} - ${album[0].artist} | Guitar Solos`;
    }, [album]);
    return album ? <>
        <div className='albumInfo'>
            <img src={album[0].cover}/>
            <div>
                <h1>{album[0].name}</h1>
                <h2><a className='label'>by</a> <a className='link' {
                    ...navigateOnClick([], [['artists', album[0].artist.toLowerCase()]])
                }>{album[0].artist}</a></h2>
            </div>
        </div>
        <div>
            {'Released in: '}
            <a className='link' {...navigateOnClick([], [['years', album[0].year + '']])}>{album[0].year}</a>
        </div>
        {album[1].length
            ? <div>
                <a>{album[1].length} songs, {album[2]} solos</a>
                <br/>
                <a>{album[3] ? `${toFixed(album[3])}/10 average rating, ` : ''}{album[4]} total ratings</a>
            </div>
            : ''}
        {user?.admin ? <>
            <textarea defaultValue={JSON.stringify(Object.fromEntries([
                ...(['name', 'artist', 'year', 'cover', 'defaultGenres'] as const).map(k => [k, album[0][k]]),
                ['complete', Object.fromEntries(completeKeys.map(k => [k, !!album[0].complete?.[k]]))],
            ]), undefined, 4)} ref={edit}/>
            <div className='row'>
                <button onClick={() => {
                    const data = JSON.parse(edit.current!.value);
                    data.complete = album[0].complete || Object.values(data.complete).some(x => x)
                        ? Object.fromEntries(Object.entries(data.complete).filter(x => x[1]))
                        : undefined;
                    request('admin/albums', 'PUT', { id: album[0].id, data }).then(inc);
                }}>Edit</button>
                <button onClick={() =>
                    confirm('Are you sure?') && request('admin/albums', 'DELETE', { id: album[0].id }).then(inc)
                }>Delete</button>
                {album[0].unverified ? <button onClick={() =>
                    request('admin/albums', 'PUT', { id: album[0].id }).then(inc)
                }>Verify</button> : ''}
            </div>
        </> : ''}
        {album[1].length ? <>
            <hr/>
            {album[1].map((x, i) => <h2 key={i} {...navigateOnClick(['song', x.id])} className='link'>{x.name}</h2>)}
        </> : ''}
        <hr/>
        {user ? <>
            <h1>Add song</h1>
            <label>Name: <input ref={name} {...enterKeydown(submit)}/></label>
            <br/>
            <label>Genres: <input
                ref={genres}
                defaultValue={album[0].defaultGenres.join(', ')}
                placeholder='Separated by ,'
                {...enterKeydown(submit)}
            /></label>
            <br/>
            <label>YouTube URL or ID: <input ref={yt} {...enterKeydown(submit)}/></label>
            <br/>
            <button onClick={submit}>Add</button>
        </> : <AuthText text='add songs to this album'/>}
    </> : error ? <h1>Album not found.</h1> : <></>;
};

type Data = [Album, Song[], number, number, number];
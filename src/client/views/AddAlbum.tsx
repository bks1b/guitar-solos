import { useContext, useEffect, useRef, useState } from 'react';
import { MainContext, enterKeydown, request } from '../util';

export default () => {
    const { navigate } = useContext(MainContext)!;
    const refs = ['name', 'artist', 'year', 'cover', 'defaultGenres'].map(k => [k, useRef<HTMLInputElement>(null)] as const);
    const search = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<string[][]>([]);
    const submit = () => request<{ id: string; }>('albums', 'POST', Object.fromEntries(
        refs.map((x, i) => [x[0], (v => i === 2 ? +v : i === 4 ? v.split(',') : v)(x[1].current!.value)]),
    )).then(d => navigate(['album', d.id]));
    const geniusSearch = () => request<string[][]>('genius', 'GET', { q: search.current!.value }).then(setResults);
    useEffect(() => {
        document.title = 'Add Album | Guitar Solos';
    }, []);
    return <>
        <label>Title: <input ref={refs[0][1]} {...enterKeydown(submit)}/></label>
        <br/>
        <label>Artist: <input ref={refs[1][1]} {...enterKeydown(submit)}/></label>
        <br/>
        <label>Year: <input type='number' ref={refs[2][1]} {...enterKeydown(submit)}/></label>
        <br/>
        <label>Cover URL: <input ref={refs[3][1]} {...enterKeydown(submit)}/></label>
        <br/>
        <label>Default genres: <input ref={refs[4][1]} placeholder='Separated by ,' {...enterKeydown(submit)}/></label>
        <br/>
        <button onClick={submit}>Add</button>
        <hr/>
        <input ref={search} {...enterKeydown(geniusSearch)}/> <button onClick={geniusSearch}>Search on Genius</button>
        <ul>{results.map((x, i) => <li key={i}>
            {x[1]} - {x[0]}
            {x[2] ? ` (${x[2]}) ` : ' '}
            <button onClick={() => refs.forEach((r, j) => r[1].current!.value = x[j] || '')}>Load</button>
        </li>)}</ul>
    </>;
};
import { useContext, useEffect, useRef, useState } from 'react';
import { MainContext } from '../util';

export default () => {
    const { request, navigate } = useContext(MainContext)!;
    const refs = ['name', 'artist', 'year', 'cover'].map(k => [k, useRef<HTMLInputElement>(null)] as const);
    const search = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<string[][]>([]);
    useEffect(() => {
        document.title = 'Add album | Guitar Solos';
    }, []);
    return <>
        <label>Title: <input ref={refs[0][1]}/></label>
        <br/>
        <label>Artist: <input ref={refs[1][1]}/></label>
        <br/>
        <label>Year: <input type='number' ref={refs[2][1]}/></label>
        <br/>
        <label>Cover URL: <input ref={refs[3][1]}/></label>
        <br/>
        <button onClick={() => request<{ id: string; }>('/add/album', Object.fromEntries(refs.map((x, i) => [x[0], i === 2 ? +x[1].current!.value : x[1].current!.value])), d => navigate(['album', d.id]))}>Add</button>
        <hr/>
        <input ref={search}/> <button onClick={() => request<string[][]>('/genius', { query: search.current!.value }, d => setResults(d))}>Search on Genius</button>
        <ul>{results.map((x, i) => <li key={i}>{x[1]} - {x[0]}{x[2] ? ` (${x[2]})` : ''} <button onClick={() => refs.forEach((r, j) => r[1].current!.value = x[j] || '')}>Load</button></li>)}</ul>
    </>;
};
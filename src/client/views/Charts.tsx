import { Fragment, useContext, useEffect, useState } from 'react';
import { Album, Solo, Song } from '../../types';
import Ratings from '../components/Ratings';
import { getTimestamp, MainContext } from '../util';

const getScore = (x: Data) => x[4] ? x[3] / Math.sqrt(x[4]) : 0;

const sortBy = ['score', 'popularity'];

export default () => {
    const { request, navigate } = useContext(MainContext);
    const params = new URLSearchParams(window.location.search);
    const [data, setData] = useState<Data[]>();
    const [sort, setSort] = useState(Math.max(sortBy.indexOf(params.get('sort')), 0));
    const filters = ['artists', 'genres'].map(x => [x, ...useState(params.get(x)?.split(';') || [])] as const);
    const [forcedChanges, setForcedChanges] = useState(0);
    useEffect(() => {
        document.title = 'Charts | Guitar Solos';
        request<Data[]>('/charts', {}, d => setData(d));
    }, []);
    useEffect(() => {
        const arr = [
            ...sort ? [['sort', sortBy[sort]]] : [],
            ...filters.flatMap(x => x[1].length ? [[x[0], x[1].join(';')]] : []),
        ];
        const path = window.location.pathname + (arr.length ? '?' + new URLSearchParams(arr) : '');
        if (window.location.pathname + window.location.search !== path) window.history.pushState('', '', path);
    });
    if (!data) return <></>;
    const results = data
        .filter(x => (!filters[0][1].length || filters[0][1].includes(x[2].artist.toLowerCase())) && (!filters[1][1].length || x[1].genres.some(x => filters[1][1].includes(x))))
        .sort((a, b) => getScore(b) - getScore(a));
    if (sort) results.sort((a, b) => b[4] - a[4]);
    return <>
        <label>Sort by: <select defaultValue={sort} onChange={e => setSort(e.target.selectedIndex)}>{sortBy.map((x, i) => <option key={i} value={i}>{x[0].toUpperCase()}{x.slice(1)}</option>)}</select></label>
        {filters.map((x, i) => <Fragment key={i}>
            <br/>
            <label>Filter by {x[0]} (seperated by semicolons): <input defaultValue={x[1].join('; ')} key={forcedChanges} onInput={e => x[2]((e.target as HTMLInputElement).value.toLowerCase().split(';').map(x => x.trim()).filter(x => x))}/></label>
        </Fragment>)}
        {
            results.length
                ? results.map((x, i) => <div key={i} className='albumInfo chart' style={{ marginTop: 'var(--content-padding)' }}>
                    <h1>{i + 1}.</h1>
                    <img src={x[2].cover} className='link' onClick={() => navigate(['album', x[2].id])}/>
                    <div>
                        <h2 className='link' onClick={() => navigate(['song', x[1].id])}>{x[1].name}</h2>
                        <h2 className='link' onClick={() => {
                            filters[0][2]([x[2].artist.toLowerCase()]);
                            setForcedChanges(forcedChanges + 1);
                        }}>{x[2].artist}</h2>
                        <h3>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h3>
                        <Ratings sum={x[3]} count={x[4]}/>
                    </div>
                </div>)
                : 'No matching solos found.'
        }
    </>;
};

type Data = [Solo, Song, Album, number, number];
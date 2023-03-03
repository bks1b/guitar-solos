import { Fragment, useContext, useEffect, useState } from 'react';
import { Album, Solo, Song } from '../../types';
import Ratings from '../components/Ratings';
import Sort, { getReducer } from '../components/Sort';
import { getTimestamp, MainContext, updateParams } from '../util';

const getScore = (x: Data) => x[4] ? x[3] / x[4] ** 0.8 : 0;

export default () => {
    const { request, navigate } = useContext(MainContext);
    const params = new URLSearchParams(window.location.search);
    const [data, setData] = useState<Data[]>();
    const [sortState, sortDispatch] = getReducer(['score', 'popularity', 'length', 'year']);
    const filters = ([['artists', x => [x[2].artist]], ['genres', x => x[1].genres], ['year', x => [x[2].year + '']]] as [string, (x: Data) => string[]][]).map(x => [...x, ...useState(params.get(x[0])?.split(';') || [])] as const);
    const [forcedChanges, setForcedChanges] = useState(0);
    useEffect(() => {
        document.title = 'Charts | Guitar Solos';
        request<Data[]>('/charts', {}, d => setData(d));
    }, []);
    useEffect(() => {
        updateParams([...sortState.params, ...filters.flatMap(x => x[2].length ? [[x[0], x[2].join(';')]] : [])]);
    });
    if (!data) return <></>;
    const results = data
        .filter(x => filters.every(y => !y[2].length || y[1](x).some(z => y[2].includes(z.toLowerCase()))))
        .sort((a, b) => getScore(b) - getScore(a));
    if (sortState.sort) results.sort((a, b) => [b[4] - a[4], b[0].end - b[0].start - a[0].end + a[0].start, b[2].year - a[2].year][sortState.sort - 1]);
    if (!sortState.order) results.reverse();
    return <>
        <Sort state={sortState} dispatch={sortDispatch}/>
        {filters.map((x, i) => <Fragment key={i}>
            {i ? <br/> : ''}
            <label>Filter by {x[0]}: <input placeholder='Seperated by ;' defaultValue={x[2].join('; ')} key={forcedChanges} onInput={e => x[3]((e.target as HTMLInputElement).value.toLowerCase().split(';').map(x => x.trim()).filter(x => x))}/></label>
        </Fragment>)}
        {
            results.length
                ? results.map((x, i) => <div key={i} className='albumInfo chart'>
                    <h1>{i + 1}.</h1>
                    <img src={x[2].cover} className='link' onClick={() => navigate(['album', x[2].id])}/>
                    <div>
                        <h2 className='link' onClick={() => navigate(['song', x[1].id])}>{x[1].name}</h2>
                        <h2 className='link' onClick={() => {
                            filters[0][3]([x[2].artist.toLowerCase()]);
                            setForcedChanges(forcedChanges + 1);
                        }}>{x[2].artist}</h2>
                        <h3>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h3>
                        <Ratings sum={x[3]} count={x[4]}/>
                    </div>
                </div>)
                : <h2>No matching solos found.</h2>
        }
    </>;
};

type Data = [Solo, Song, Album, number, number];
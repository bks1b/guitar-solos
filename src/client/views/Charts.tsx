import { useContext, useEffect, useState } from 'react';
import Ratings from '../components/Ratings';
import { getTimestamp, MainContext, onClick, resolveParams, Solos, updateParams } from '../util';
import Filters, { getReducer } from '../components/Filters';

const getScore = (x: Solos[number]) => x[4] ? x[3] / x[4] ** 0.8 : 0;

export default () => {
    const { request, navigateOnClick } = useContext(MainContext)!;
    const [data, setData] = useState<Solos>();
    const [state, dispatch] = getReducer(['score', 'popularity', 'length', 'year']);
    useEffect(() => {
        document.title = 'Charts | Guitar Solos';
        request<Solos>('/charts', null, d => setData(d));
    }, []);
    useEffect(() => {
        updateParams(state.getParams());
    });
    if (!data) return <></>;
    const results = state.filters.apply(data).sort((a, b) => getScore(b) - getScore(a));
    if (state.sort.sort) results.sort((a, b) => [b[4] - a[4], b[0].end - b[0].start - a[0].end + a[0].start, b[2].year - a[2].year][state.sort.sort - 1]);
    if (!state.sort.order) results.reverse();
    return <>
        <Filters state={state} dispatch={dispatch}/>
        {
            results.length
                ? results.map((x, i) => <div key={i} className='albumInfo chart'>
                    <h1>{i + 1}.</h1>
                    <img src={x[2].cover} className='link' {...navigateOnClick(['album', x[2].id])}/>
                    <div>
                        <h2 className='link' {...navigateOnClick(['song', x[1].id])}>{x[1].name}</h2>
                        <h2 className='link' {...onClick(() => dispatch(['filter', 0, [x[2].artist.toLowerCase()], true]), () => window.open(resolveParams(state.getParams(0, x[2].artist.toLowerCase()))))}>{x[2].artist}</h2>
                        <h3>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h3>
                        <Ratings sum={x[3]} count={x[4]}/>
                    </div>
                </div>)
                : <h2>No matching solos found.</h2>
        }
    </>;
};
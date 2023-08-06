import { useContext, useEffect, useState } from 'react';
import Ratings from '../components/Ratings';
import { getTimestamp, MainContext, onClick, resolveParams, Solos, updateParams } from '../util';
import Filters, { getFilterReducer } from '../components/Filters';

const getScore = (x: Solos[number]) => x[4] ? x[3] / x[4] ** 0.8 : 0;

export default () => {
    const { request, navigateOnClick } = useContext(MainContext)!;
    const [data, setData] = useState<Solos>();
    const [state, dispatch] = getFilterReducer(['score', 'popularity', 'length', 'year']);
    useEffect(() => {
        document.title = 'Charts | Guitar Solos';
        request<Solos>('/charts', null, d => setData(d));
    }, []);
    useEffect(() => {
        updateParams(state.getParams());
    });
    if (!data) return <></>;
    const results = state.filters.apply(data).sort((a, b) => getScore(b) - getScore(a));
    if (state.sort.sort) results.sort((a, b) => (f => f(b) - f(a))((x: typeof a) => [x[4], x[0].end - x[0].start, x[2].year][state.sort.sort - 1]));
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
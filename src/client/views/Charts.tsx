import { useContext, useEffect, useState } from 'react';
import Ratings from '../components/Ratings';
import { getTimestamp, MainContext, onClick, resolveParams, updateParams } from '../util';
import { Filter, Sort, getFilterReducer, getSortReducer } from '../components/Filters';
import { Solos, applyFilters } from '../../util';
import List from '../components/List';

const STEP = 200;

const getScore = (x: Solos[number]) => x[4] ? x[3] / x[4] ** 0.8 : 0;

export default () => {
    const { request, navigateOnClick } = useContext(MainContext)!;
    const [data, setData] = useState<Solos>();
    const [filterState, filterDispatch] = getFilterReducer();
    const [sortState, sortDispatch] = getSortReducer(['score', 'popularity', 'length', 'year']);
    useEffect(() => {
        document.title = 'Charts | Guitar Solos';
        request<Solos>('/charts', null, d => setData(d));
    }, []);
    useEffect(() => {
        updateParams([...filterState.getParams(), ...sortState.getParams()]);
    });
    if (!data) return <></>;
    const results = applyFilters(filterState.arr, data).sort((a, b) => getScore(b) - getScore(a));
    if (sortState.sort) results.sort((a, b) => (f => f(b) - f(a))((x: typeof a) => [x[4], x[0].end - x[0].start, x[2].year][sortState.sort - 1]));
    if (!sortState.order) results.reverse();
    return <>
        <Filter state={filterState} dispatch={filterDispatch}/>
        <Sort state={sortState} dispatch={sortDispatch}/>
        {
            results.length
                ? <List length={results.length} step={STEP} render={c => results.slice(0, c).map((x, i) => <div key={i} className='albumInfo chart'>
                    <h1>{i + 1}.</h1>
                    <img src={x[2].cover} className='link' {...navigateOnClick(['album', x[2].id])}/>
                    <div>
                        <h2 className='link' {...navigateOnClick(['song', x[1].id], [['solo', x[0].id]])}>{x[1].name}</h2>
                        <h2 className='link' {...onClick(m => m ? window.open(resolveParams([...filterState.getParams(0, x[2].artist.toLowerCase()), ...sortState.getParams()])) : filterDispatch(['filter', 0, [x[2].artist.toLowerCase()], true]))}>{x[2].artist}</h2>
                        <h3>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h3>
                        <Ratings sum={x[3]} count={x[4]}/>
                    </div>
                </div>)}/>
                : <h2>No matching solos found.</h2>
        }
    </>;
};
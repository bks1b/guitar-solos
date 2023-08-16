import { useEffect } from 'react';
import { updateParams } from '../util';
import { Filter, getFilterReducer } from '../components/Filters';
import Stats, { getStatSortReducer } from '../components/Stats';

export default () => {
    const [filterState, filterDispatch] = getFilterReducer();
    const [sortState, sortDispatch] = getStatSortReducer();
    useEffect(() => {
        document.title = 'Stats | Guitar Solos';
    }, []);
    useEffect(() => updateParams([...filterState.getParams(), ...sortState.getParams()]));
    return <>
        <h1>Info</h1>
        <a href='https://github.com/bks1b/guitar-solos' target='_blank'>Source code</a>
        <h1>Stats</h1>
        <Filter state={filterState} dispatch={filterDispatch}/>
        <Stats requestData={['/stats', null]} filterState={filterState} sortState={sortState} sortDispatch={sortDispatch}/>
    </>;
};
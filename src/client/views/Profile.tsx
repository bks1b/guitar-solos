import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, StatsType, noSolos, resolveParams, updateParams } from '../util';
import { Filter, Sort, getFilterReducer, getSortReducer } from '../components/Filters';
import RatingStats, { getStatSortReducer } from '../components/Stats';
import { Solos, applyFilters } from '../../util';
import List from '../components/List';

const STEP = 150;

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext)!;
    const [user, setUser] = useState<Data>();
    const [error, setError] = useState(false);
    const [view, setView] = useState(new URLSearchParams(window.location.search).get('view') === 'stats');
    const [filterState, filterDispatch] = getFilterReducer();
    const [ratingSortState, ratingSortDispatch] = getSortReducer(['recency', 'rating', 'length', 'year']);
    const [statSortState, statSortDispatch] = getStatSortReducer();
    useEffect(() => {
        request<Data>('/profile', { name }, x => setUser(x), () => setError(true));
    }, []);
    useEffect(() => {
        if (user) document.title = `${user[0]} | Guitar Solos`;
    }, [user]);
    useEffect(() => {
        updateParams([...filterState.getParams(), ...view ? [['view', 'stats'], ...statSortState.getParams()] : ratingSortState.getParams()]);
    });
    if (error) return <h1>User not found.</h1>;
    if (!user) return <></>;
    const arr = applyFilters(filterState.arr, user[2]);
    if (ratingSortState.sort) arr.sort((a, b) => (f => f(b) - f(a))((x: typeof a) => [x[3], x[0].end - x[0].start, x[2].year][ratingSortState.sort - 1]));
    if (+!!ratingSortState.sort ^ ratingSortState.order) arr.reverse();
    return <>
        <h1 className='center'>{user[0]}</h1>
        <div className='center'>{user[1]}</div>
        {
            user[2].length
                ? <>
                    <Filter state={filterState} dispatch={filterDispatch}/>
                    <button onClick={() => setView(!view)}>View {view ? 'ratings' : 'stats'}</button>
                    {
                        view
                            ? <RatingStats requestData={['/profile/stats', { name }]} filterState={filterState} sortState={statSortState} sortDispatch={statSortDispatch} path={['profile', user[0]]} profile/>
                            : <>
                                <div style={{ marginBottom: 'var(--content-padding)' }}><Sort state={ratingSortState} dispatch={ratingSortDispatch}/></div>
                                {
                                    arr.length
                                        ? <List length={arr.length} step={STEP} center render={c => <Albums arr={arr.slice(0, c)} navigateArtist={a => m => m ? window.open(resolveParams(filterState.getParams(0, a))) : filterDispatch(['filter', 0, [a], true])} ratings ts/>}/>
                                        : noSolos
                                }
                            </>
                    }
                </>
                : <h2>This user hasn't rated any solos.</h2>
        }
    </>;
};

type Data = [string, string, Solos, StatsType];
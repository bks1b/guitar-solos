import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, RatingStatsType, Solos, resolveParams, updateParams } from '../util';
import Filters, { getFilterReducer } from '../components/Filters';
import RatingStats, { getSortReducer } from '../components/RatingStats';

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext)!;
    const [user, setUser] = useState<Data>();
    const [view, setView] = useState(new URLSearchParams(window.location.search).get('view') === 'stats');
    const [filterState, filterDispatch] = getFilterReducer(['recency', 'rating', 'length', 'year']);
    const [sortState, sortDispatch] = getSortReducer();
    useEffect(() => {
        request<Data>('/profile', { name }, x => setUser(x));
    }, []);
    useEffect(() => {
        if (user) document.title = `${user[0]} | Guitar Solos`;
    }, [user]);
    useEffect(() => {
        updateParams(view ? [['view', 'stats'], ...sortState.getParams()] : filterState.getParams());
    });
    if (!user) return <></>;
    if (!user[1].length) return <>
        <h1 className='center'>{user[0]}</h1>
        <a>This user hasn't rated any solos.</a>
    </>;
    const arr = filterState.filters.apply(user[1]);
    if (filterState.sort.sort) arr.sort((a, b) => [b[3] - a[3], b[0].end - b[0].start - a[0].end + a[0].start, b[2].year - a[2].year][filterState.sort.sort - 1]);
    if (+!!filterState.sort.sort ^ filterState.sort.order) arr.reverse();
    return <>
        <h1 className='center'>{user[0]}</h1>
        <button onClick={() => setView(!view)}>View {view ? 'ratings' : 'stats'}</button>
        {
            view
                ? <div>
                    <a>{user[1].length} solos rated</a>
                    <RatingStats data={user[2]} state={sortState} dispatch={sortDispatch} path={['profile', user[0]]} profile/>
                </div>
                : <>
                    <div style={{ marginBottom: 'var(--content-padding)' }}><Filters state={filterState} dispatch={filterDispatch}/></div>
                    <Albums arr={arr} navigateArtist={a => m => m ? window.open(resolveParams(filterState.getParams(0, a))) : filterDispatch(['filter', 0, [a], true])} ratings ts/>
                </>
        }
    </>;
};

type Data = [string, Solos, RatingStatsType];
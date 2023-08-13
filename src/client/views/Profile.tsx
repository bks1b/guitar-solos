import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, RatingStatsType, Solos, resolveParams, updateParams } from '../util';
import Filters, { getFilterReducer } from '../components/Filters';
import RatingStats, { getSortReducer } from '../components/RatingStats';

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext)!;
    const [user, setUser] = useState<Data>();
    const [error, setError] = useState(false);
    const [view, setView] = useState(new URLSearchParams(window.location.search).get('view') === 'stats');
    const [filterState, filterDispatch] = getFilterReducer(['recency', 'rating', 'length', 'year']);
    const [sortState, sortDispatch] = getSortReducer();
    useEffect(() => {
        request<Data>('/profile', { name }, x => setUser(x), () => setError(true));
    }, []);
    useEffect(() => {
        if (user) document.title = `${user[0]} | Guitar Solos`;
    }, [user]);
    useEffect(() => {
        updateParams(view ? [['view', 'stats'], ...sortState.getParams()] : filterState.getParams());
    });
    if (error) return <h1>User not found.</h1>;
    if (!user) return <></>;
    const arr = filterState.filters.apply(user[2]);
    if (filterState.sort.sort) arr.sort((a, b) => (f => f(b) - f(a))((x: typeof a) => [x[3], x[0].end - x[0].start, x[2].year][filterState.sort.sort - 1]));
    if (+!!filterState.sort.sort ^ filterState.sort.order) arr.reverse();
    return <>
        <h1 className='center'>{user[0]}</h1>
        <div className='center'>{user[1]}</div>
        {
            user[2].length
                ? <>
                    <button onClick={() => setView(!view)}>View {view ? 'ratings' : 'stats'}</button>
                    {
                        view
                            ? <div>
                                <a>{user[2].length} solos rated</a>
                                <RatingStats data={user[3]} state={sortState} dispatch={sortDispatch} path={['profile', user[0]]} profile/>
                            </div>
                            : <>
                                <div style={{ marginBottom: 'var(--content-padding)' }}><Filters state={filterState} dispatch={filterDispatch}/></div>
                                {
                                    arr.length
                                        ? <Albums arr={arr} navigateArtist={a => m => m ? window.open(resolveParams(filterState.getParams(0, a))) : filterDispatch(['filter', 0, [a], true])} ratings ts/>
                                        : <h2>No matching solos found.</h2>
                                }
                            </>
                    }
                </>
                : <h2>This user hasn't rated any solos.</h2>
        }
    </>;
};

type Data = [string, string, Solos, RatingStatsType];
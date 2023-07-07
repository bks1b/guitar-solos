import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, RatingStatsType, Solos, updateParams } from '../util';
import Filters, { getReducer } from '../components/Filters';
import RatingStats from '../components/RatingStats';

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext)!;
    const [user, setUser] = useState<Data>();
    const [view, setView] = useState(+new URLSearchParams(window.location.search).has('stats'));
    const [state, dispatch] = getReducer(['recency', 'rating', 'length', 'year']);
    useEffect(() => {
        request<Data>('/profile', { name }, x => setUser(x));
    }, []);
    useEffect(() => {
        if (user) document.title = `${user[0]} | Guitar Solos`;
    }, [user]);
    useEffect(() => {
        updateParams(view ? [['stats', '']] : state.getParams());
    });
    if (!user) return <></>;
    if (!user[1].length) return <>
        <h1 className='center'>{user[0]}</h1>
        <a>This user hasn't rated any solos.</a>
    </>;
    const arr = state.filters.apply(user[1]);
    if (state.sort.sort) arr.sort((a, b) => [b[3] - a[3], b[0].end - b[0].start - a[0].end + a[0].start, b[2].year - a[2].year][state.sort.sort - 1]);
    if (+!!state.sort.sort ^ state.sort.order) arr.reverse();
    return <>
        <h1 className='center'>{user[0]}</h1>
        <button onClick={() => setView(1 - view)}>View {view ? 'ratings' : 'stats'}</button>
        {
            view
                ? <div>
                    <a>{user[1].length} solos rated</a>
                    <RatingStats data={user[2]} path={['profile', user[0]]}/>
                </div>
                : <>
                    <div style={{ marginBottom: 'var(--content-padding)' }}><Filters state={state} dispatch={dispatch}/></div>
                    <Albums arr={arr} navigateArtist={a => dispatch(['filter', 0, [a], true])} ratings ts/>
                </>
        }
    </>;
};

type Data = [string, Solos, RatingStatsType];
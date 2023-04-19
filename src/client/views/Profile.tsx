import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import Sort, { getReducer } from '../components/Sort';
import { MainContext, Solos, updateParams } from '../util';
import RatingTable from '../components/RatingTable';

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext)!;
    const [user, setUser] = useState<[string, Solos, number[][]]>();
    const [sortState, sortDispatch] = getReducer(['recency', 'rating', 'length', 'year']);
    useEffect(() => {
        request<[string, Solos, number[][]]>('/profile', { name }, x => setUser(x));
    }, []);
    useEffect(() => {
        if (user) document.title = `${user[0]} | Guitar Solos`;
    }, [user]);
    useEffect(() => {
        updateParams(sortState.params);
    });
    if (!user) return <></>;
    const arr = [...user[1]];
    if (sortState.sort) arr.sort((a, b) => [b[3] - a[3], b[0].end - b[0].start - a[0].end + a[0].start, b[2].year - a[2].year][sortState.sort - 1]);
    if (+!!sortState.sort ^ sortState.order) arr.reverse();
    return <>
        <h1 className='center'>{user[0]}</h1>
        <a>{user[1].length} solos rated</a>
        {
            user[1].length
                ? <RatingTable data={user[2]}/>
                : ''
        }
        <div style={{ marginBottom: 'var(--content-padding)' }}><Sort state={sortState} dispatch={sortDispatch}/></div>
        <Albums arr={arr} ratings ts/>
    </>;
};
import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import Sort, { getReducer } from '../components/Sort';
import { MainContext, Solos, updateParams } from '../util';

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext)!;
    const [user, setUser] = useState<[string, Solos]>();
    const [sortState, sortDispatch] = getReducer(['recency', 'rating', 'length', 'year']);
    useEffect(() => {
        request<[string, Solos]>('/profile', { name }, x => setUser(x));
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
                ? <table>
                    <thead><tr>
                        <th>Rating</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr></thead>
                    <tbody>{Array.from({ length: 11 }, (_, i) => {
                        const n = user[1].filter(x => x[3] === i).length;
                        return n
                            ? <tr key={i}>
                                <td>{i}/10</td>
                                <td>{n}</td>
                                <td>
                                    <div style={{ width: n / user[1].length * 250 }} className='bar'>&nbsp;</div>
                                    <a>{+(n / user[1].length * 100).toFixed(1)}%</a>
                                </td>
                            </tr>
                            : null;
                    })}</tbody>
                </table>
                : ''
        }
        <div style={{ marginBottom: 'var(--content-padding)' }}><Sort state={sortState} dispatch={sortDispatch}/></div>
        <Albums arr={arr} ratings ts/>
    </>;
};
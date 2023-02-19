import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, renderSortBy, Solos } from '../util';

const sortBy = ['recency', 'rating'];

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext);
    const [user, setUser] = useState<[string, Solos]>();
    const [sort, setSort] = useState(Math.max(sortBy.indexOf( new URLSearchParams(window.location.search).get('sort')), 0));
    useEffect(() => {
        request<[string, Solos]>('/profile', { name }, x => setUser(x));
    }, []);
    useEffect(() => {
        if (user) document.title = `${user[0]} | Guitar Solos`;
    }, [user]);
    return user
        ? <>
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
            <label style={{ display: 'block', marginBottom: 'var(--content-padding)' }}>Sort by: <select defaultValue={sort} onChange={e => {
                setSort(e.target.selectedIndex);
                window.history.pushState('', '', window.location.pathname + (e.target.selectedIndex ? '?sort=' + sortBy[e.target.selectedIndex] : ''));
            }}>{renderSortBy(sortBy)}</select></label>
            <Albums arr={[...user[1]].sort((a, b) => sort ? b[3] - a[3] : -1)} ratings ts/>
        </>
        : <></>;
};
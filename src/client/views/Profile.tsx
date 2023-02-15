import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, Solos } from '../util';

export default ({ name }: { name: string; }) => {
    const { request } = useContext(MainContext);
    const [user, setUser] = useState<[string, Solos]>();
    const [sort, setSort] = useState(0);
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
            <table>
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
                                <a>{+(n / user[1].length).toFixed(1)}%</a>
                            </td>
                        </tr>
                        : null;
                })}</tbody>
            </table>
            <label style={{ display: 'block', marginBottom: 'var(--content-padding)' }}>Sort by: <select defaultValue={sort} onChange={e => setSort(e.target.selectedIndex)}>
                <option>Recency</option>
                <option>Rating</option>
            </select></label>
            <Albums arr={[...user[1]].sort((a, b) => sort ? b[3] - a[3] : -1)} ratings ts/>
        </>
        : <></>;
};
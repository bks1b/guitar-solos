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
            <label style={{ display: 'block', marginBottom: 'var(--content-padding)' }}>Sort by: <select defaultValue={sort} onChange={e => setSort(e.target.selectedIndex)}>
                <option>Recency</option>
                <option>Rating</option>
            </select></label>
            <Albums arr={[...user[1]].sort((a, b) => sort ? b[3] - a[3] : -1)} ratings ts/>
        </>
        : <></>;
};
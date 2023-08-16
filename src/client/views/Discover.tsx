import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, onClick, resolvePath } from '../util';
import { Solos } from '../../util';

export default () => {
    const { request, navigate } = useContext(MainContext)!;
    const [data, setData] = useState<Solos>();
    useEffect(() => {
        request<Solos>('/discover', null, x => setData(x));
    }, []);
    useEffect(() => {
        document.title = 'Discover | Guitar Solos';
    }, []);
    return <>
        <div className='row' style={{ marginBottom: 'var(--content-padding)' }}>{['album', 'song', 'solo'].map(x => <button key={x} {...onClick(m => request<Record<'id' | 'solo', string>>('/random/' + x, null, d => {
            const path = [[x === 'album' ? x : 'song', d.id], x === 'solo' ? [[x, d.solo]] : []] as [string[], string[][]];
            if (m) window.open(resolvePath(...path));
            else navigate(...path);
        }))}>Random {x}</button>)}</div>
        {data ? <Albums arr={data} ts/> : ''}
    </>;
};
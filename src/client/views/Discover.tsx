import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, Solos } from '../util';

export default () => {
    const { request } = useContext(MainContext)!;
    const [data, setData] = useState<Solos>();
    useEffect(() => {
        request<Solos>('/discover', null, x => setData(x));
    }, []);
    useEffect(() => {
        document.title = 'Discover | Guitar Solos';
    }, []);
    return data
        ? <Albums arr={data} ts/>
        : <></>;
};
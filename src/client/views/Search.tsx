import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, Solos } from '../util';

export default ({ str }: { str: string; }) => {
    const { request } = useContext(MainContext)!;
    const [data, setData] = useState<Solos[]>();
    useEffect(() => {
        document.title = 'Search | Guitar Solos';
        request<Solos[]>('/search', { str }, x => setData(x));
    }, []);
    return data
        ? <>
            {
                data[0].length
                    ? <>
                        <h1>Albums</h1>
                        <Albums arr={data[0]} album/>
                    </>
                    : ''
            }
            {
                data[1].length
                    ? <>
                        <h1>Songs</h1>
                        <Albums arr={data[1]}/>
                    </>
                    : ''
            }
            {data[0].length || data[1].length ? '' : <h1>No songs or albums found.</h1>}
        </>
        : <></>;
};
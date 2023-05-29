import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, Solos } from '../util';

export default ({ str }: { str: string; }) => {
    const { request, navigate } = useContext(MainContext)!;
    const [data, setData] = useState<Data>();
    useEffect(() => {
        document.title = 'Search | Guitar Solos';
        request<Data>('/search', { str }, x => setData(x));
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
            {
                data[2].length
                    ? <>
                        <h1>Users</h1>
                        <ul>{data[2].map(x => <li className='link' onClick={() => navigate(['profile', x])}>{x}</li>)}</ul>
                    </>
                    : ''
            }
            {
                data.some(x => x.length)
                    ? ''
                    : <h1>No songs or albums found.</h1>
            }
        </>
        : <></>;
};

type Data = [Solos, Solos, string[]];
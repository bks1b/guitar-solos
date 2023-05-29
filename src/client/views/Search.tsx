import { useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, Solos } from '../util';
import List from '../components/List';

const STEP = 20;

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
                        <List arr={data[0]} step={STEP} render={a => <Albums arr={a} album/>}/>
                    </>
                    : ''
            }
            {
                data[1].length
                    ? <>
                        <h1>Songs</h1>
                        <List arr={data[1]} step={STEP} render={a => <Albums arr={a}/>}/>
                    </>
                    : ''
            }
            {
                data[2].length
                    ? <>
                        <h1>Users</h1>
                        <List arr={data[2].map((x, i) => <li key={i} className='link' onClick={() => navigate(['profile', x])}>{x}</li>)} step={10} render={a => <ul>{a}</ul>}/>
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
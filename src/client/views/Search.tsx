import { Fragment, useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, Solos } from '../util';
import List from '../components/List';

const STEP = 20;
const LIST_STEP = 10;

export default ({ str }: { str: string; }) => {
    const { request, navigate } = useContext(MainContext)!;
    const [data, setData] = useState<Data>();
    useEffect(() => {
        document.title = 'Search | Guitar Solos';
        request<Data>('/search', { str }, x => setData(x));
    }, []);
    return data
        ? <>
            {['Albums', 'Songs'].map((x, i) => <Fragment key={i}>{
                data[i].length
                    ? <>
                        <h1>{x}</h1>
                        <List arr={data[i] as Solos} step={STEP} render={a => <Albums arr={a} album={!i}/>}/>
                    </>
                    : ''
            }</Fragment>)}
            {['Users', 'Artists', 'Guitarists', 'Genres'].map((x, i) => <Fragment key={i}>{
                data[i + 2].length
                    ? <>
                        <h1>{x}</h1>
                        <List arr={(data[i + 2] as string[]).map((y, j) => <li key={j} className='link' onClick={() => navigate(...(i ? [[], [[x.toLowerCase(), y.toLowerCase()]]] : [['profile', y]]) as [string[], string[][]])}>{y}</li>)} step={LIST_STEP} render={a => <ul>{a}</ul>}/>
                    </>
                    : ''
            }</Fragment>)}
            {
                data.some(x => x.length)
                    ? ''
                    : <h1>No songs or albums found.</h1>
            }
        </>
        : <></>;
};

type Data = [Solos, Solos, string[], string[], string[], string[]];
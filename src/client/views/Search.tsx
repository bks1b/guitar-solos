import { Fragment, useContext, useEffect, useState } from 'react';
import Albums from '../components/Albums';
import { MainContext, request } from '../util';
import List from '../components/List';
import { Solos } from '../../util';

const STEP = 20;
const LIST_STEP = 10;

export default ({ str }: { str: string; }) => {
    const { navigateOnClick } = useContext(MainContext)!;
    const [data, setData] = useState<Data>();
    useEffect(() => {
        document.title = 'Search | Guitar Solos';
        request<Data>('search', 'GET', { q: str }).then(setData);
    }, []);
    return data ? <>
        {['Albums', 'Songs'].map((x, i) => <Fragment key={i}>{data[i].length ? <>
            <h1>{x}</h1>
            <List
                length={data[i].length}
                step={STEP}
                center
                render={c => <Albums arr={data[i].slice(0, c) as Solos} album={!i}/>}
            />
        </> : ''}</Fragment>)}
        {['Users', 'Artists', 'Guitarists', 'Genres'].map((x, i) => <Fragment key={i}>{data[i + 2].length ? <>
            <h1>{x}</h1>
            <List
                length={data[i + 2].length}
                step={LIST_STEP}
                render={c => <ul>{(data[i + 2] as string[])
                    .slice(0, c)
                    .map((y, j) => <li key={j} className='link' {
                        ...navigateOnClick(...(i
                            ? [[], [[x.toLowerCase(), y.toLowerCase()]]]
                            : [['profile', y]]) as [string[], string[][]])
                    }>{y}</li>)
                }</ul>}
            />
        </> : ''}</Fragment>)}
        {data.some(x => x.length) ? '' : <h1>No songs or albums found.</h1>}
    </> : <></>;
};

type Data = [Solos, Solos, string[], string[], string[], string[]];
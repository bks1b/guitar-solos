import { useContext, useEffect, useState } from 'react';
import { Album, Solo, Song } from '../../types';
import Ratings from '../components/Ratings';
import { getTimestamp, MainContext } from '../util';

const getScore = (x: Data) => x[4] ? x[3] / Math.sqrt(x[4]) : 0;

export default () => {
    const { request, navigate } = useContext(MainContext);
    const [data, setData] = useState<Data[]>();
    const [sort, setSort] = useState(0);
    useEffect(() => {
        document.title = 'Charts | Guitar Solos';
        request<Data[]>('/charts', {}, d => setData(d));
    }, []);
    return data
        ? <>
            <label>Sort by: <select defaultValue={sort} onChange={e => setSort(e.target.selectedIndex)}>
                <option>Score</option>
                <option>Popularity</option>
            </select></label>
            {
                data
                    .sort((a, b) => sort ? b[4] - a[4] : getScore(b) - getScore(a))
                    .map((x, i) => <div key={i} className='albumInfo chart' style={{ marginTop: 'var(--content-padding)' }}>
                        <h1>{i + 1}.</h1>
                        <img src={x[2].cover} className='link' onClick={() => navigate(['album', x[2].id])}/>
                        <div>
                            <h2 className='link' onClick={() => navigate(['song', x[1].id])}>{x[1].name}</h2>
                            <h2>{x[2].artist}</h2>
                            <h3>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h3>
                            <Ratings sum={x[3]} count={x[4]}/>
                        </div>
                    </div>)
            }
        </>
        : <></>;
};

type Data = [Solo, Song, Album, number, number];
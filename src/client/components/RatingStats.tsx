import { useContext, useState } from 'react';
import { MainContext, RatingStatsType, toFixed } from '../util';

const STEP = 10;

const List = ({ arr }: { arr: JSX.Element[]; }) => {
    const [count, setCount] = useState(STEP);
    return <>
        {arr.slice(0, count)}
        {arr.length > count ? <button onClick={() => setCount(count + STEP)} className='listBtn'>Show more</button> : ''}
        {count > STEP ? <button onClick={() => setCount(count - STEP)} className='listBtn'>Show less</button> : ''}
    </>;
};

export default ({ data }: { data: RatingStatsType; }) => {
    const { navigate } = useContext(MainContext)!;
    const total = data.ratings.reduce((a, b) => a + b[1], 0);
    return <div>
        <a>Average rating: {toFixed(data.ratings.reduce((a, b) => a + b[0] * b[1], 0) / total)}/10</a>
        <table>
            <thead><tr>
                <th>Rating</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr></thead>
            <tbody>{data.ratings.map(x => <tr key={x[0]}>
                <td>{x[0]}/10</td>
                <td>{x[1]}</td>
                <td>
                    <div style={{ width: x[1] / total * 250 }} className='bar'>&nbsp;</div>
                    <a>{toFixed(x[1] / total * 100)}%</a>
                </td>
            </tr>)}</tbody>
        </table>
        <h1>Highest rated albums</h1>
        <List arr={data.albums.map((x, i) => <div key={i} className='albumInfo chart'>
            <h2>{i + 1}.</h2>
            <img src={x[0].cover} className='link' onClick={() => navigate(['album', x[0].id])}/>
            <div>
                <h2 className='link' onClick={() => navigate(['album', x[0].id])}>{x[0].name}</h2>
                <h2 className='link' onClick={() => navigate([], [['artists', x[0].artist.toLowerCase()]])}>{x[0].artist}</h2>
                <a>{x[1]} songs, {x[2]} solos</a>
                <br/>
                <a>{toFixed(x[4])}/10 average rating, {x[5]} total ratings</a>
            </div>
        </div>)}/>
        <h1>Highest rated artists</h1>
        <List arr={data.artists.map((x, i) => <div key={i}>
            <h3>{i + 1}. <a className='link' onClick={() => navigate([], [['artists', x[0].toLowerCase()]])}>{x[0]}</a></h3>
            <ul>
                <li>{x[6]} albums, {x[1]} songs, {x[2]} solos</li>
                <li>{toFixed(x[4])}/10 average rating, {x[5]} total ratings</li>
            </ul>
        </div>)}/>
    </div>;
};
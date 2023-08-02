import { Fragment, useContext } from 'react';
import { MainContext, RatingStatsType, toFixed } from '../util';
import List from './List';

const STEP = 10;

export default ({ data, path = [] }: { data: RatingStatsType; path?: string[]; }) => {
    const { navigateOnClick } = useContext(MainContext)!;
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
            <img src={x[0].cover} className='link' {...navigateOnClick(['album', x[0].id])}/>
            <div>
                <h2 className='link' {...navigateOnClick(['album', x[0].id])}>{x[0].name}</h2>
                <h2 className='link' {...navigateOnClick(path, [['artists', x[0].artist.toLowerCase()]])}>{x[0].artist}</h2>
                <a>{x[1]} songs, {x[2]} solos</a>
                <br/>
                <a>{toFixed(x[4])}/10 average rating, {x[5]} total ratings</a>
            </div>
        </div>)} step={STEP}/>
        {(['artists', 'years'] as const).map(k => <Fragment key={k}>
            <h1>Highest rated {k}</h1>
            <List arr={data[k].map((x, i) => <div key={i}>
                <h3>{i + 1}. <a className='link' {...navigateOnClick(path, [[k, x[0].toLowerCase()]])}>{x[0]}</a></h3>
                <ul>
                    <li>{x[6]} albums, {x[1]} songs, {x[2]} solos</li>
                    <li>{toFixed(x[4])}/10 average rating, {x[5]} total ratings</li>
                </ul>
            </div>)} step={STEP}/>
        </Fragment>)}
        <h1>Highest rated guitarists</h1>
        <List arr={data.guitarists.map((x, i) => <div key={i}>
            <h3>{i + 1}. <a className='link' {...navigateOnClick(path, [['guitarists', x[0].toLowerCase()]])}>{x[0]}</a></h3>
            <ul>
                <li>{x[5]} solos, {x[1]} artists</li>
                <li>{toFixed(x[3])}/10 average rating, {x[4]} total ratings</li>
            </ul>
        </div>)} step={STEP}/>
        <h1>Highest rated genres</h1>
        <List arr={data.genres.map((x, i) => <div key={i}>
            <h3>{i + 1}. <a className='link' {...navigateOnClick(path, [['genres', x[0]]])}>{x[0]}</a></h3>
            <ul>
                <li>{x[1]} songs, {x[2]} solos</li>
                <li>{toFixed(x[4])}/10 average rating, {x[5]} total ratings</li>
            </ul>
        </div>)} step={STEP}/>
    </div>;
};
import { Dispatch, Fragment, useContext, useReducer } from 'react';
import { MainContext, RatingStatsType, orderBy, toFixed } from '../util';
import List from './List';

const STEP = 10;

const statKeys = (['albums', 'artists', 'years', 'guitarists', 'genres'] as const).map(k => [k, ['score', 'popularity', 'solos', k === 'guitarists' ? 'artists' : 'songs', ...['artists', 'years'].includes(k) ? ['albums'] : []]] as const);

export const getSortReducer = () => {
    const params = new URLSearchParams(window.location.search);
    return useReducer((state: State, action: Action) => {
        state.keys[action[0]][action[1]] = action[2];
        return { ...state };
    }, {
        keys: statKeys.map(x => [Math.max(x[1].indexOf(params.get('sort_' + x[0])!), 0), +(params.get('order_' + x[0]) !== orderBy[0])]),
        getParams() {
            return this.keys.flatMap((x: number[], i: number) => [...x[0] ? [['sort_' + statKeys[i][0], statKeys[i][1][x[0]]]] : [], ...x[1] ? [] : [['order_' + statKeys[i][0], orderBy[0]]]]);
        },
    });
};

export default ({ data, state, dispatch, path = [], profile = false }: { data: RatingStatsType; state: State; dispatch: Dispatch<Action>; path?: string[]; profile?: boolean; }) => {
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
        {[
            (x: RatingStatsType['albums'][number], i: number) => <div key={i} className='albumInfo chart'>
                <h2>{i + 1}.</h2>
                <img src={x[0].cover} className='link' {...navigateOnClick(['album', x[0].id])}/>
                <div>
                    <h2 className='link' {...navigateOnClick(['album', x[0].id])}>{x[0].name}</h2>
                    <h2 className='link' {...navigateOnClick(path, [['artists', x[0].artist.toLowerCase()]])}>{x[0].artist}</h2>
                    <a>{x[1]} songs, {x[2]} solos</a>
                    <br/>
                    <a>{toFixed(x[4])}/10 average rating{profile ? '' : `, ${x[5]} total ratings`}</a>
                </div>
            </div>,
            ...(['artists', 'years', 'guitarists', 'genres'] as const).map((k, j) => (x: RatingStatsType[typeof k][number], i: number) => <div key={i}>
                <h3>{i + 1}. <a className='link' {...navigateOnClick(path, [[k, x[0].toLowerCase()]])}>{x[0]}</a></h3>
                <ul>
                    {
                        j < 2
                            ? <li>{x[6]} albums, {x[1]} songs, {x[2]} solos</li>
                            : [<li>{x[2]} solos, {x[1]} artists</li>, <li>{x[1]} songs, {x[2]} solos</li>][j - 2]
                    }
                    <li>{toFixed(x[4])}/10 average rating{profile ? '' : `, ${x[5]} total ratings`}</li>
                </ul>
            </div>),
        ].map((f, i) => {
            const arr = [...data[statKeys[i][0]]].sort((a, b) => b[3] - a[3]);
            if (state.keys[i][0]) arr.sort((a, b) => (g => g(b) - g(a))((x: typeof a) => [x[5] / x[2], x[2], x[1], x[6]!][state.keys[i][0] - 1]));
            if (!state.keys[i][1]) arr.reverse();
            return <Fragment key={i}>
                <h1>Highest rated {statKeys[i][0]}</h1>
                <a>Sort by: </a>
                {[statKeys[i][1], orderBy].map((a, j) => <Fragment key={j}>
                    {j ? <a> </a> : ''}
                    <select defaultValue={state.keys[i][j]} onChange={e => dispatch([i, j, +e.target.selectedOptions[0].value])}>{a.map((x, k) => !profile || x !== 'popularity' ? <option key={k} value={k}>{x}</option> : '')}</select>
                </Fragment>)}
                <List arr={arr.map((x, i) => f(x as any, i))} step={STEP}/>
            </Fragment>;
        })}
    </div>;
};

type State = {
    keys: number[][];
    getParams(): string[][];
};
type Action = [number, number, number];
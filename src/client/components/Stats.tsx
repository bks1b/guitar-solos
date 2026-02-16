import { Dispatch, Fragment, useContext, useEffect, useReducer, useState } from 'react';
import { MainContext, StatsType, completeKeys, getTimestamp, noSolos, orderBy, request, toFixed } from '../util';
import { Album } from '../../util';
import List from './List';
import { FilterState } from './Filters';

const STEP = 10;
const TIMEOUT = 500;

const totalKeys = ['solo', 'song', 'album', 'artist', 'guitarist'];
const statKeys = (['albums', 'artists', 'years', 'guitarists', 'genres', 'tags'] as const).map(k => [
    k,
    [
        'score', 'popularity', 'solos',
        ...k === 'tags' ? [] : k === 'guitarists' ? ['artists'] : ['songs'],
        ...['artists', 'years'].includes(k) ? ['albums'] : [],
    ],
] as const);

export const getStatSortReducer = () => {
    const params = new URLSearchParams(window.location.search);
    return useReducer((state: State, action: Action) => {
        state.keys[action[0]][action[1]] = action[2];
        return { ...state };
    }, {
        keys: statKeys.map(x => [
            Math.max(x[1].indexOf(params.get('sort_' + x[0])!), 0),
            +(params.get('order_' + x[0]) !== orderBy[0]),
        ]),
        getParams() {
            return this.keys.flatMap((x: number[], i: number) => [
                ...x[0] ? [['sort_' + statKeys[i][0], statKeys[i][1][x[0]]]] : [],
                ...x[1] ? [] : [['order_' + statKeys[i][0], orderBy[0]]],
            ]);
        },
    } as State);
};

export default (props: {
    requestData: string;
    filterState: FilterState;
    sortState: State;
    sortDispatch: Dispatch<Action>;
    path?: string[];
    profile?: boolean;
}) => {
    const { navigateOnClick, user } = useContext(MainContext)!;
    const [data, setData] = useState<StatsType>();
    const [albumFilters, setAlbumFilters] = useState<boolean[][]>(completeKeys.map(() => [true, true]));
    useEffect(() => {
        const timeout = setTimeout(
            () => request<StatsType>(props.requestData, 'GET', props.filterState.getParams()).then(setData),
            data ? TIMEOUT : 0,
        );
        return () => clearTimeout(timeout);
    }, [props.filterState]);
    if (!data) return <></>;
    if (!data.total[1]) return noSolos;
    const total = data.ratings.reduce((a, b) => a + b[1], 0);
    const filterAlbums = albumFilters.some(a => a.some(x => !x));
    return <div>
        <a>Total:</a>
        <ul>{['user', ...totalKeys].map((x, i) =>
            !props.profile || i ? <li key={i}>{data.total[i]} {x}s</li> : '',
        )}</ul>
        <a>Average:</a>
        <ul>
            {totalKeys.slice(0, -2).flatMap((a, i) => totalKeys
                .slice(i + 1, -1)
                .map((b, j) => <li key={`${i},${j}`}>
                    {toFixed(data.total[i + 1] / data.total[j + i + 2])}
                    {` ${a}s per ${b}`}
                </li>))}
            {props.profile ? '' : <li>
                {toFixed(data.ratings.reduce((a, b) => a + b[1], 0) / data.total[0])}
                {' solos rated per user'}
            </li>}
        </ul>
        <a>Average solo duration: {getTimestamp(Math.round(data.averageDuration))}</a>
        <br/>
        <a>Average rating: {toFixed(data.ratings.reduce((a, b) => a + b[0] * b[1], 0) / total)}/10</a>
        {props.profile ? '' : <>
            <br/>
            <a>Albums:</a>
            <ul>{['', ' without bonus tracks'].map((s, i) => {
                const n = data.albums.filter(x => x[0].complete?.album && (i || x[0].complete?.bonus)).length;
                return <li key={i}>{n} albums complete{s} ({toFixed(n / data.albums.length * 100)}%)</li>;
            })}</ul>
        </>}
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
            (x: StatsType['albums'][number], i: number) => <div key={i} className='albumInfo chart'>
                <h2>{i + 1}.</h2>
                <img src={x[0].cover} className='link' {...navigateOnClick(['album', x[0].id])}/>
                <div>
                    <h2 className='link' {
                        ...navigateOnClick(['album', x[0].id])
                    }>{x[0].name}</h2>
                    <h2 className='link' {
                        ...navigateOnClick(props.path || [], [['artists', x[0].artist.toLowerCase()]])
                    }>{x[0].artist}</h2>
                    <a>{x[1]} songs, {x[2]} solos</a>
                    <br/>
                    <a>{toFixed(x[4])}/10 average rating{props.profile ? '' : `, ${x[5]} total ratings`}</a>
                    {filterAlbums && completeKeys.some(k => !x[0].complete?.[k])
                        ? <div>Missing {completeKeys
                            .filter(k => !x[0].complete?.[k])
                            .map(k => `"${k}"`)
                            .join(', ')}</div>
                        : ''
                    }
                </div>
            </div>,
            ...(['artists', 'years', 'guitarists', 'genres', 'tags'] as const).map((k, j) =>
                (x: StatsType[typeof k][number], i: number) => <div key={i}>
                    <h3>
                        {i + 1}{'. '}
                        <a className='link' {...navigateOnClick(props.path || [], [[k, x[0].toLowerCase()]])}>{x[0]}</a>
                    </h3>
                    <ul>
                        {j < 2
                            ? <li>{x[6]} albums, {x[1]} songs, {x[2]} solos</li>
                            : [
                                <li>{x[2]} solos, {x[1]} artists</li>,
                                <li>{x[1]} songs, {x[2]} solos</li>,
                                <li>{x[2]} solos</li>,
                            ][j - 2]
                        }
                        <li>{toFixed(x[4])}/10 average rating{props.profile ? '' : `, ${x[5]} total ratings`}</li>
                    </ul>
                </div>,
            ),
        ].map((f, i) => {
            const arr = [...data[statKeys[i][0]]]
                .filter(x => i || !filterAlbums || completeKeys.every((k, j) => albumFilters[j][+!(x[0] as Album).complete?.[k]]))
                .sort((a, b) => b[3] - a[3]);
            if (props.sortState.keys[i][0]) {
                const g = (x: typeof arr[number]) => [x[5] / x[2], x[2], x[1], x[6]!][props.sortState.keys[i][0] - 1];
                arr.sort((a, b) => g(b) - g(a));
            }
            if (!props.sortState.keys[i][1]) arr.reverse();
            return <Fragment key={i}>
                <h1>Highest rated {statKeys[i][0]}</h1>
                <a>Sort by: </a>
                {[statKeys[i][1], orderBy].map((a, j) => <Fragment key={j}>
                    {j ? <a> </a> : ''}
                    <select
                        defaultValue={props.sortState.keys[i][j]}
                        onChange={e => props.sortDispatch([i, j, +e.target.selectedOptions[0].value])}
                    >{
                            a.map((x, k) => !props.profile || x !== 'popularity' ? <option key={k} value={k}>{x}</option> : '')
                        }</select>
                </Fragment>)}
                {user?.admin && !i && !props.profile ? completeKeys.map((c, j) => <div key={j}>{c}: {
                    ['complete', 'incomplete'].map((s, k) => <label key={k} className='tagLabel'>
                        {s + ' '}
                        <input type='checkbox' defaultChecked={albumFilters[j][k]} onChange={e => {
                            albumFilters[j][k] = e.target.checked;
                            setAlbumFilters([...albumFilters]);
                        }}/>
                    </label>)
                }</div>) : ''}
                <List length={arr.length} step={STEP} render={c => arr.slice(0, c).map((x, j) => f(x as any, j))}/>
            </Fragment>;
        })}
    </div>;
};

type State = {
    keys: number[][];
    getParams(): string[][];
};
type Action = [number, number, number];
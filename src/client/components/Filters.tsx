import { Dispatch, Fragment, useReducer } from 'react';
import { Solos } from '../util';

const orderBy = ['ascending', 'descending'];

export const getReducer = (arr: string[]) => {
    const params = new URLSearchParams(window.location.search);
    return useReducer((state: State, action: Action) => {
        if (action[0] === 'filter') {
            state.filters.arr[action[1]][3] = action[2];
            if (action[3]) state.filters.forced++;
        } else if (action[0] === 'filterMode') state.filters.arr[action[1]][4] = action[2];
        else state.sort[action[1]] = action[2];
        return { ...state };
    }, {
        sort: {
            arr,
            sort: Math.max(arr.indexOf(params.get('sort')!), 0),
            order: +(params.get('order') !== orderBy[0]),
        },
        filters: {
            arr: ([
                ['artists', x => [x[2].artist], false],
                ['guitarists', x => x[0].guitarists, true],
                ['genres', x => x[1].genres, true],
                ['year', x => [x[2].year + ''], false],
            ] as [string, (x: Solos[number]) => string[], boolean][]).map(x => [...x, params.get(x[0])?.toLowerCase().split(';') || [], params.get(x[0] + '_mode') === 'all'] as Filter),
            forced: 0,
            apply(d: Solos) {
                return d.filter(x => this.arr.every(y => {
                    if (!y[3].length) return true;
                    const arr = y[1](x as any).map(s => s.toLowerCase());
                    return y[3][y[4] ? 'every' : 'some'](s => arr.includes(s));
                }));
            },
        },
        getParams() {
            return [
                ...this.sort.sort ? [['sort', arr[this.sort.sort]]] : [],
                ...this.sort.order ? [] : [['order', orderBy[0]]],
                ...this.filters.arr.flatMap((x: Filter) => x[3].length ? [[x[0], x[3].join(';')], ...x[2] && x[4] ? [[x[0] + '_mode', 'all']] : []] : []),
            ];
        },
    });
};

export default ({ state, dispatch }: { state: State; dispatch: Dispatch<Action>; }) => <div>
    <a>Sort by: </a>
    {([['sort', state.sort.arr], ['order', orderBy]] as ['sort' | 'order', string[]][]).map((x, i) => <Fragment key={i}>
        {i ? <a> </a> : ''}
        <select defaultValue={state.sort[x[0]]} onChange={e => dispatch(['sort', x[0], e.target.selectedIndex])}>{x[1].map((x, i) => <option key={i} value={i}>{x}</option>)}</select>
    </Fragment>)}
    <br/>
    {state.filters.arr.map((x, i) => <Fragment key={i}>
        {i ? <br/> : ''}
        <label>Filter by {x[0]}: <input placeholder='Separated by ;' defaultValue={x[3].join('; ')} key={state.filters.forced} onInput={e => dispatch(['filter', i, (e.target as HTMLInputElement).value.toLowerCase().split(';').map(x => x.trim()).filter(x => x)])}/></label>
        {' '}{x[2] ? <select defaultValue={x[4] ? 'all' : 'any'} onChange={e => dispatch(['filterMode', i, !!e.target.selectedIndex])}><option>any</option><option>all</option></select> : ''}
    </Fragment>)}
</div>;

type Filter = [string, (x: Solos[number]) => string[], boolean, string[], boolean];
type State = {
    sort: {
        arr: string[];
        sort: number;
        order: number;
    };
    filters: {
        arr: Filter[];
        forced: number;
        apply(d: Solos): Solos;
    };
    getParams(): string[][];
};
type Action = ['sort', 'sort' | 'order', number] | ['filter', number, string[], boolean?] | ['filterMode', number, boolean];
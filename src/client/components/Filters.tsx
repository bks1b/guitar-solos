import { Dispatch, Fragment, useReducer } from 'react';
import { Filters, loadFilters } from '../../util';

const orderBy = ['ascending', 'descending'];

export const getSortReducer = (arr: string[]) => {
    const params = new URLSearchParams(window.location.search);
    return useReducer((state: SortState, action: SortAction) => {
        state[action[0]] = action[1];
        return { ...state };
    }, {
        arr,
        sort: Math.max(arr.indexOf(params.get('sort')!), 0),
        order: +(params.get('order') !== orderBy[0]),
        getParams() {
            return [
                ...this.sort ? [['sort', arr[this.sort]]] : [],
                ...this.order ? [] : [['order', orderBy[0]]],
            ];
        },
    });
};
export const getFilterReducer = () => {
    const params = new URLSearchParams(window.location.search);
    return useReducer((state: FilterState, action: FilterAction) => {
        if (action[0] === 'filter') {
            state.arr[action[1]][3] = action[2];
            if (action[3]) state.forced++;
        } else state.arr[action[1]][4] = action[2];
        return { ...state };
    }, {
        arr: loadFilters(Object.fromEntries([...params])),
        forced: 0,
        getParams(i?: number, s?: string) {
            return (this.arr as Filters).flatMap((x, j) => {
                const arr = [...x[3], ...i === j && !x[3].includes(s!) ? [s] : []];
                return arr.length ? [[x[0], arr.join(';')], ...x[2] && x[4] ? [[x[0] + '_mode', 'all']] : []] : [];
            });
        },
    });
};

export const Sort = ({ state, dispatch }: { state: SortState; dispatch: Dispatch<SortAction>; }) => <div>
    <a>Sort by: </a>
    {([['sort', state.arr], ['order', orderBy]] as ['sort' | 'order', string[]][]).map((x, i) => <Fragment key={i}>
        {i ? <a> </a> : ''}
        <select defaultValue={state[x[0]]} onChange={e => dispatch([x[0], e.target.selectedIndex])}>{x[1].map((x, i) => <option key={i} value={i}>{x}</option>)}</select>
    </Fragment>)}
</div>;
export const Filter = ({ state, dispatch }: { state: FilterState; dispatch: Dispatch<FilterAction>; }) => <div>{state.arr.map((x, i) => <Fragment key={i}>
    {i ? <br/> : ''}
    <label>Filter by {x[0]}: <input placeholder='Separated by ;' defaultValue={x[3].join('; ')} key={state.forced} onInput={e => dispatch(['filter', i, (e.target as HTMLInputElement).value.toLowerCase().split(';').map(x => x.trim()).filter(x => x)])}/></label>
    {' '}{x[2] ? <select defaultValue={x[4] ? 'all' : 'any'} onChange={e => dispatch(['filterMode', i, !!e.target.selectedIndex])}><option>any</option><option>all</option></select> : ''}
</Fragment>)}</div>;

type SortState = {
    arr: string[];
    sort: number;
    order: number;
    getParams(): string[][];
};
export type FilterState = {
    arr: Filters;
    forced: number;
    getParams(i?: number, s?: string): string[][];
};
type SortAction = ['sort' | 'order', number];
type FilterAction = ['filter', number, string[], boolean?] | ['filterMode', number, boolean];
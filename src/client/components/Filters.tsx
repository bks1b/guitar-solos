import { Dispatch, Fragment, useEffect, useReducer } from 'react';
import { Solos, updateParams } from '../util';

const orderBy = ['ascending', 'descending'];

export const getReducer = (arr: string[]) => {
    const params = new URLSearchParams(window.location.search);
    return useReducer((state: State, action: Action) => {
        if (action[0] === 'filter') {
            state.filters.arr[action[1]][2] = action[2];
            if (action[3]) state.filters.forced++;
        } else state.sort[action[1]] = action[2];
        return { ...state };
    }, {
        sort: {
            arr,
            sort: Math.max(arr.indexOf(params.get('sort')!), 0),
            order: +(params.get('order') !== orderBy[0]),
        },
        filters: {
            arr: ([['artists', x => [x[2].artist]], ['genres', x => x[1].genres], ['year', x => [x[2].year + '']]] as [string, (x: Solos[number]) => string[]][]).map(x => [...x, params.get(x[0])?.split(';') || []] as Filter),
            forced: 0,
            apply(d: Solos) {
                return d.filter(x => this.arr.every(y => !y[2].length || y[1](x as any).some(z => y[2].includes(z.toLowerCase()))));
            },
        },
        getParams() {
            return [
                ...this.sort.sort ? [['sort', arr[this.sort.sort]]] : [],
                ...this.sort.order ? [] : [['order', orderBy[0]]],
                ...this.filters.arr.flatMap((x: Filter) => x[2].length ? [[x[0], x[2].join(';')]] : []),
            ];
        },
    });
};

export default ({ state, dispatch }: { state: State; dispatch: Dispatch<Action>; }) => {
    useEffect(() => {
        updateParams(state.getParams());
    });
    return <div>
        <a>Sort by: </a>
        {([['sort', state.sort.arr], ['order', orderBy]] as ['sort' | 'order', string[]][]).map((x, i) => <Fragment key={i}>
            {i ? <a> </a> : ''}
            <select defaultValue={state.sort[x[0]]} onChange={e => dispatch(['sort', x[0], e.target.selectedIndex])}>{x[1].map((x, i) => <option key={i} value={i}>{x}</option>)}</select>
        </Fragment>)}
        <br/>
        {state.filters.arr.map((x, i) => <Fragment key={i}>
            {i ? <br/> : ''}
            <label>Filter by {x[0]}: <input placeholder='Separated by ;' defaultValue={x[2].join('; ')} key={state.filters.forced} onInput={e => dispatch(['filter', i, (e.target as HTMLInputElement).value.toLowerCase().split(';').map(x => x.trim()).filter(x => x)])}/></label>
        </Fragment>)}
    </div>;
};

type Filter = [string, (x: Solos[number]) => string[], string[]];
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
type Action = ['sort', 'sort' | 'order', number] | ['filter', number, string[], boolean?];
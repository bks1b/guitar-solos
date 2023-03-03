import { Dispatch, Fragment, useReducer } from 'react';

const orderBy = ['ascending', 'descending'];

export const getReducer = (arr: string[]) => {
    const params = new URLSearchParams(window.location.search);
    return useReducer((state: SortState, action: SortAction) => {
        state[action[0]] = action[1];
        return {
            ...state,
            params: [
                ...state.sort ? [['sort', arr[state.sort]]] : [],
                ...state.order ? [] : [['order', orderBy[0]]],
            ],
        };
    }, {
        arr,
        sort: Math.max(arr.indexOf(params.get('sort')!), 0),
        order: +(params.get('order') !== orderBy[0]),
        params: [...params],
    });
};

export default ({ state, dispatch }: { state: SortState; dispatch: Dispatch<SortAction>; }) => <div>
    <a>Sort by: </a>
    {([['sort', state.arr], ['order', orderBy]] as ['sort' | 'order', string[]][]).map((x, i) => <Fragment key={i}>
        {i ? <a> </a> : ''}
        <select defaultValue={state[x[0]]} onChange={e => dispatch([x[0], e.target.selectedIndex])}>{x[1].map((x, i) => <option key={i} value={i}>{x}</option>)}</select>
    </Fragment>)}
</div>;

type SortState = {
    arr: string[];
    sort: number;
    order: number;
    params: string[][];
};
type SortAction = ['sort' | 'order', number];
import { useContext } from 'react';
import { MainContext } from '../util';

export default ({ arr, query }: { arr: string[]; query: string; }) => {
    const { navigate } = useContext(MainContext)!;
    return <>{arr.map((x, i) => <a key={i}><a className='link' onClick={() => navigate([], [[query, x.toLowerCase()]])}>{x}</a>{i < arr.length - 1 ? ', ' : ''}</a>)}</>;
};
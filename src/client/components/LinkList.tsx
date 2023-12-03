import { Fragment, useContext } from 'react';
import { MainContext } from '../util';

export default ({ arr, query }: { arr: string[]; query: string; }) => {
    const { navigateOnClick } = useContext(MainContext)!;
    return <>{arr.map((x, i) => <Fragment key={i}><a className='link' {...navigateOnClick([], [[query, x.toLowerCase()]])}>{x}</a>{i < arr.length - 1 ? ', ' : ''}</Fragment>)}</>;
};
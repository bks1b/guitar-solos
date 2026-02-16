import { Fragment, useContext } from 'react';
import { MainContext } from '../util';

export default (props: { arr: string[]; query: string; }) => {
    const { navigateOnClick } = useContext(MainContext)!;
    return <>{props.arr.map((x, i) => <Fragment key={i}>
        <a className='link' {...navigateOnClick([], [[props.query, x.toLowerCase()]])}>{x}</a>
        {i < props.arr.length - 1 ? ', ' : ''}
    </Fragment>)}</>;
};
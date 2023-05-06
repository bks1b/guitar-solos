import { useState } from 'react';

const STEP = 10;

export default ({ arr }: { arr: JSX.Element[]; }) => {
    const [count, setCount] = useState(STEP);
    return <>
        {arr.slice(0, count)}
        {arr.length > count ? <button onClick={() => setCount(count + STEP)} className='listBtn'>Show more</button> : ''}
        {count > STEP ? <button onClick={() => setCount(count - STEP)}>Show less</button> : ''}
    </>;
};
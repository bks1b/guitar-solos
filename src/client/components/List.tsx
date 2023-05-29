import { useState } from 'react';

export default <T = JSX.Element>({ arr, step, render = a => <>{a}</> }: { arr: T[]; step: number; render?: (a: T[]) => JSX.Element; }) => {
    const [count, setCount] = useState(step);
    return <>
        {render(arr.slice(0, count))}
        {arr.length > count ? <button onClick={() => setCount(count + step)} className='listBtn'>Show more</button> : ''}
        {count > step ? <button onClick={() => setCount(count - step)} className='listBtn'>Show less</button> : ''}
    </>;
};
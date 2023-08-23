import { useState } from 'react';

export default ({ length, step, center = false, render }: { length: number; step: number; center?: boolean; render: (c: number) => JSX.Element | JSX.Element[]; }) => {
    const [count, setCount] = useState(step);
    return <>
        {render(count)}
        <div className={center ? 'center' : undefined}>
            {length > count ? <button onClick={() => setCount(count + step)} className='listBtn'>Show more</button> : ''}
            {count > step ? <button onClick={() => setCount(count - step)} className='listBtn'>Show less</button> : ''}
        </div>
    </>;
};
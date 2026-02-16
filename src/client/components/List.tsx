import { ReactElement, useState } from 'react';

export default (props: {
    length: number;
    step: number;
    center?: boolean;
    render: (c: number) => ReactElement | ReactElement[];
}) => {
    const [count, setCount] = useState(props.step);
    return <>
        {props.render(count)}
        <div className={props.center ? 'center' : undefined}>
            {props.length > count
                ? <button onClick={() => setCount(count + props.step)} className='listBtn'>Show more</button>
                : ''
            }
            {count > props.step
                ? <button onClick={() => setCount(count - props.step)} className='listBtn'>Show less</button>
                : ''
            }
        </div>
    </>;
};
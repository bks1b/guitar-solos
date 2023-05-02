import { useState } from 'react';

export default ({ arr }: { arr: JSX.Element[]; }) => {
    const [count, setCount] = useState(10);
    return <>
        {arr.slice(0, count)}
        <button onClick={() => setCount(count + 10)}>Load more</button>
    </>;
};
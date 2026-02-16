import { toFixed } from '../util';

export default ({ sum, count }: Record<'sum' | 'count', number>) => <>
    {count ? <>
        <a>Average rating: {toFixed(sum / count)}/10</a>
        <br/>
    </> : ''}
    <a>Total ratings: {count}</a>
    <br/>
</>;
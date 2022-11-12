export default ({ sum, count }: Record<'sum' | 'count', number>) => <>
    {
        count
            ? <>
                <a>Average rating: {+(sum / count).toFixed(1)}/10</a>
                <br/>
            </>
            : ''
    }
    <a>Total ratings: {count}</a>
    <br/>
</>;
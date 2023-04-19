import { toFixed } from '../util';

export default ({ data }: { data: number[][]; }) => {
    const total = data.reduce((a, b) => a + b[1], 0);
    return <div>
        <a>Average rating: {toFixed(data.reduce((a, b) => a + b[0] * b[1], 0) / total)}/10</a>
        <table>
            <thead><tr>
                <th>Rating</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr></thead>
            <tbody>{data.map(x => <tr key={x[0]}>
                <td>{x[0]}/10</td>
                <td>{x[1]}</td>
                <td>
                    <div style={{ width: x[1] / total * 250 }} className='bar'>&nbsp;</div>
                    <a>{toFixed(x[1] / total * 100)}%</a>
                </td>
            </tr>)}</tbody>
        </table>
    </div>;
};
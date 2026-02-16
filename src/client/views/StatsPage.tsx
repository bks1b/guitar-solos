import { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Filter, getFilterReducer } from '../components/Filters';
import Stats, { getStatSortReducer } from '../components/Stats';
import { getTimestamp, noSolos, request, updateParams } from '../util';
import { Solos, applyFilters } from '../../util';

Chart.register(zoomPlugin);

const TIMEOUT = 500;

const Graph = ({ arr, points }: { arr: [string, number][]; points?: boolean; }) => {
    const [first, setFirst] = useState(true);
    const canvas = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        let chart: Chart;
        setFirst(false);
        const timeout = setTimeout(() => chart = new Chart(canvas.current!.getContext('2d')!, {
            type: 'line',
            data: {
                labels: arr.map(x => x[0]),
                datasets: [{
                    data: arr.map(x => x[1]),
                    fill: true,
                    pointRadius: points ? undefined : 0,
                }],
            },
            options: {
                scales: { y: {
                    suggestedMin: 0,
                    suggestedMax: Math.max(...arr.map(x => x[1])),
                } },
                plugins: {
                    legend: { display: false },
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                    },
                },
            },
        }), first ? 0 : TIMEOUT);
        return () => {
            clearTimeout(timeout);
            chart?.destroy();
        };
    }, [arr]);
    return <canvas ref={canvas}/>;
};

const Graphs = ({ arr }: { arr: Solos; }) => {
    if (!arr.length) return noSolos;
    const resultsWithDuration = arr.filter(x => x[1].duration);
    const songsWithDuration = [...new Set(resultsWithDuration.map(x => JSON.stringify(x[1])))].map(x => JSON.parse(x));
    const maxSongDuration = Math.max(...songsWithDuration.map(x => x.duration));
    const soloDurations = arr.map(x => x[0].end - x[0].start);
    const years = arr.map(x => x[2].year);
    const minYear = Math.min(...years);
    return <>
        <h1>Number of solos per year</h1>
        <Graph arr={Array.from(
            { length: Math.max(...years) - minYear + 1 },
            (_, i) => [minYear + i + '', arr.filter(x => x[2].year === minYear + i).length],
        )} points/>
        <h1>Timeline of all solos played together</h1>
        <Graph arr={Array.from(
            { length: Math.max(...arr.map(x => x[0].end)) + 1 },
            (_, i) => [getTimestamp(i), arr.filter(x => i >= x[0].start && i <= x[0].end).length],
        )}/>
        <h1>Timeline of all solos played together, relative to song length</h1>
        <Graph arr={Array.from(
            { length: maxSongDuration + 1 },
            (_, i) => [
                +(i / maxSongDuration * 100).toFixed(2) + '%',
                resultsWithDuration.filter(x => (v => v >= x[0].start && v <= x[0].end)(i / maxSongDuration * x[1].duration)).length,
            ],
        )}/>
        <h1>Timeline of all songs played together</h1>
        <Graph arr={Array.from(
            { length: maxSongDuration + 1 },
            (_, i) => [getTimestamp(i), songsWithDuration.filter(x => i <= x.duration).length],
        )}/>
        <h1>Timeline of all solos played together, starting at once</h1>
        <Graph arr={Array.from(
            { length: Math.max(...soloDurations) + 1 },
            (_, i) => [getTimestamp(i), soloDurations.filter(x => i <= x).length],
        )}/>
    </>;
};

export default () => {
    const [data, setData] = useState<Solos>();
    const [view, setView] = useState(new URLSearchParams(window.location.search).get('view') === 'graphs');
    const [filterState, filterDispatch] = getFilterReducer();
    const [sortState, sortDispatch] = getStatSortReducer();
    useEffect(() => {
        document.title = 'Stats | Guitar Solos';
        request<Solos>('charts').then(setData);
    }, []);
    useEffect(() => updateParams([
        ...view ? [['view', 'graphs']] : [],
        ...filterState.getParams(),
        ...sortState.getParams(),
    ]));
    return data ? <>
        <Filter state={filterState} dispatch={filterDispatch}/>
        <button onClick={() => setView(!view)}>View {view ? 'stats' : 'graphs'}</button>
        {view
            ? <Graphs arr={applyFilters(filterState.arr, data)}/>
            : <Stats requestData={'stats'} filterState={filterState} sortState={sortState} sortDispatch={sortDispatch}/>
        }
    </> : <></>;
};
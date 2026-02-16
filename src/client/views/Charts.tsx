import { useContext, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import Ratings from '../components/Ratings';
import { MainContext, getTimestamp, noSolos, onClick, request, resolveParams, updateParams } from '../util';
import { Filter, Sort, getFilterReducer, getSortReducer } from '../components/Filters';
import { COUNT_WEIGHT, Solos, applyFilters } from '../../util';
import List from '../components/List';

const STEP = 200;
const FILENAME = 'guitar_solo_tier_list';
const IMAGE_SIZE = 300;
const PADDING = 6;
const FONT = '"Segoe UI"';
const FONT_COLOR = 'white';
const FONT_WEIGHT = 400;
const BORDER_COLOR = 'black';
const BORDER_SIZE = 8;
const BORDER_SHADOW = 10;
const MIN_FONT_SIZE = 55;
const MAX_FONT_SIZE = 95;

const getScore = (x: Solos[number]) => x[4] ? x[3] / x[4] ** COUNT_WEIGHT : 0;

const getPartitions = (str: string, depth: number): string[][] => {
    if (!depth || !str.includes(' ')) return [[str]];
    const arr = [];
    for (let i = 0; i < str.length; i++)
        if (str[i] === ' ')
            arr.push(...getPartitions(str.slice(i + 1), depth - 1).map(s => [str.slice(0, i), ...s]));
    return arr;
};
const getBestPartition = (str: string, length: number) => getPartitions(str, length - 1)
    .map(s => [
        s,
        s.reduce((x, a) => x + s.reduce((y, b) => y + (a.length - b.length) ** 2, 0), 0),
    ] as [string[], number])
    .sort((a, b) => a[1] - b[1])[0][0];

const getFontSize = (w: number) => Math.min(Math.floor((IMAGE_SIZE - 2 * PADDING) / w), MAX_FONT_SIZE);
const drawText = (ctx: CanvasRenderingContext2D, s: string, fontSize: number, offset = 0) => {
    ctx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT}`;
    ctx.strokeText(s, IMAGE_SIZE / 2, IMAGE_SIZE / 2 + offset);
    ctx.fillText(s, IMAGE_SIZE / 2, IMAGE_SIZE / 2 + offset);
};

export default ({ tierlist = false }: { tierlist?: boolean; }) => {
    const { navigateOnClick } = useContext(MainContext)!;
    const [data, setData] = useState<Solos>();
    const [filterState, filterDispatch] = getFilterReducer();
    const [sortState, sortDispatch] = getSortReducer(['score', 'popularity', 'length', 'year']);
    const canvas = useRef<HTMLCanvasElement>(null);
    const progress = useRef<HTMLAnchorElement>(null);
    useEffect(() => {
        document.title = `${tierlist ? 'Tier List Generator' : 'Charts'} | Guitar Solos`;
        request<Solos>('charts').then(setData);
    }, []);
    useEffect(() => {
        updateParams([...filterState.getParams(), ...sortState.getParams()]);
    });
    if (!data) return <></>;
    const results = applyFilters(filterState.arr, data).sort((a, b) => getScore(b) - getScore(a));
    if (sortState.sort) {
        const f = (x: Solos[number]) => [x[4], x[0].end - x[0].start, x[2].year][sortState.sort - 1];
        results.sort((a, b) => f(b) - f(a));
    }
    if (!sortState.order) results.reverse();
    return <>
        <Filter state={filterState} dispatch={filterDispatch}/>
        <Sort state={sortState} dispatch={sortDispatch}/>
        {tierlist ? <>
            <canvas width={IMAGE_SIZE} height={IMAGE_SIZE} ref={canvas} style={{ display: 'none' }}/>
            <button className='tierlistButton' onClick={async () => {
                const songs: Record<string, number> = {};
                const images: Record<string, HTMLImageElement> = {};
                const zip = new JSZip();
                const ctx = canvas.current!.getContext('2d')!;
                let count = 0;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.strokeStyle = BORDER_COLOR;
                ctx.fillStyle = FONT_COLOR;
                ctx.shadowColor = BORDER_COLOR;
                ctx.lineWidth = BORDER_SIZE;
                ctx.shadowBlur = BORDER_SHADOW;
                for (const solo of [...results].sort((a, b) => a[0].start - b[0].start)) {
                    progress.current!.innerText = `${count++}/${results.length}`;
                    images[solo[2].cover] ||= await new Promise(r => {
                        const img = new Image();
                        img.src = solo[2].cover;
                        img.crossOrigin = 'anonymous';
                        img.onload = () => r(img);
                    });
                    ctx.drawImage(images[solo[2].cover], 0, 0, IMAGE_SIZE, IMAGE_SIZE);
                    ctx.font = `${FONT_WEIGHT} 1px ${FONT}`;
                    const text = solo[1].name + (results.filter(r => r[1].id === solo[1].id).length > 1
                        ? ` (${songs[solo[1].id] = (songs[solo[1].id] || 0) + 1})`
                        : '');
                    const fillFontSize = getFontSize(ctx.measureText(text).width);
                    if (fillFontSize < MIN_FONT_SIZE) {
                        const split = getBestPartition(text, Math.ceil(MIN_FONT_SIZE / fillFontSize));
                        const fontSize = getFontSize(Math.max(...split.map(s => ctx.measureText(s).width)));
                        for (let i = 0; i < split.length; i++)
                            drawText(ctx, split[i], fontSize, (i + (1 - split.length) / 2) * fontSize);
                    } else drawText(ctx, text, fillFontSize);
                    await new Promise(r => canvas.current!.toBlob(blob => r(zip
                        .folder(FILENAME)!
                        .file(`${solo[2].name}; ${solo[1].name} (${songs[solo[1].id] || 1}).png`, blob!))));
                }
                progress.current!.innerText = 'Generating ZIP';
                zip.generateAsync({ type: 'base64' }).then(d => {
                    const a = document.createElement('a');
                    a.download = `${FILENAME}.zip`;
                    a.href = `data:application/zip;base64,${d}`;
                    a.click();
                    progress.current!.innerText = '';
                });
            }}>Download images</button>
            <a ref={progress}></a>
        </> : ''}
        {results.length ? <List
            length={results.length}
            step={STEP}
            render={c => results.slice(0, c).map((x, i) => <div key={i} className='albumInfo chart'>
                <h1>{i + 1}.</h1>
                <img src={x[2].cover} className='link' {...navigateOnClick(['album', x[2].id])}/>
                <div>
                    <h2 className='link' {...navigateOnClick(['song', x[1].id], [['solo', x[0].id]])}>{x[1].name}</h2>
                    <h2 className='link' {...onClick(m => m
                        ? window.open(resolveParams([
                            ...filterState.getParams(0, x[2].artist.toLowerCase()),
                            ...sortState.getParams(),
                        ]))
                        : filterDispatch(['filter', 0, [x[2].artist.toLowerCase()], true]),
                    )}>{x[2].artist}</h2>
                    <h3>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h3>
                    {tierlist
                        ? <button
                            onClick={() => setData(data.filter(d => d !== x))}
                            className='removeButton'
                        >Remove from list</button>
                        : <Ratings sum={x[3]} count={x[4]}/>
                    }
                </div>
            </div>)}
        /> : noSolos}
    </>;
};
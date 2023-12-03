import { RefObject, useContext, useEffect, useRef, useState } from 'react';
import { Album, Solo, Solos, Song } from '../../util';
import Albums from '../components/Albums';
import Ratings from '../components/Ratings';
import { enterKeydown, getSecs, getTimestamp, MainContext } from '../util';
import LinkList from '../components/LinkList';
import AuthText from '../components/AuthText';

const TimeInput = ({ _ref, sec, f }: { _ref: RefObject<HTMLInputElement>; sec?: boolean; f: () => any; }) => <input type='number' min={0} max={sec ? 59 : undefined} placeholder={sec ? 's' : 'm'} className='num' ref={_ref} {...enterKeydown(f)}/>;

const tags = ['electric', 'acoustic', 'bass', 'slide', 'backwards', 'electric over acoustic', 'intro', 'outro'];

export default ({ id }: { id: string; }) => {
    const { request, navigateOnClick, loggedIn, admin } = useContext(MainContext)!;
    const selected = new URLSearchParams(window.location.search).get('solo');
    const [reload, setReload] = useState(0);
    const [song, setSong] = useState<Data>();
    const [error, setError] = useState(false);
    const [hidden, setHidden] = useState<Record<string, boolean>>({});
    const [players, setPlayers] = useState<string[]>([]);
    const startM = useRef<HTMLInputElement>(null);
    const startS = useRef<HTMLInputElement>(null);
    const endM = useRef<HTMLInputElement>(null);
    const endS = useRef<HTMLInputElement>(null);
    const guitarists = useRef<HTMLInputElement>(null);
    const tagRefs = tags.map(() => useRef<HTMLInputElement>(null));
    const edit = useRef<HTMLTextAreaElement>(null);
    const ratings: Record<string, HTMLInputElement> = {};
    const solos: Record<string, HTMLInputElement> = {};
    const submit = () => {
        try {
            request('/add/solo', {
                song: id,
                start: getSecs(startM, startS),
                end: getSecs(endM, endS),
                guitarists: guitarists.current!.value.split(';'),
                tags: tags.filter((_, i) => tagRefs[i].current!.checked),
            }, () => {
                startM.current!.value = startS.current!.value = endM.current!.value = endS.current!.value = guitarists.current!.value = '';
                tagRefs.forEach(r => r.current!.checked = false);
                setReload(reload + 1);
            });
        } catch (e) {
            alert('Error: ' + e);
        }
    };
    const rate = (x: [Solo, ...any]) => () => request('/rate', { id: x[0].id, rating: +ratings[x[0].id].value }, () => setReload(reload + 1));
    useEffect(() => {
        request<Data>('/get/song?id=' + id, null, x => setSong(x), () => setError(true));
    }, [reload]);
    useEffect(() => {
        if (song) {
            document.title = `${song[0].name} - ${song[1].artist} | Guitar Solos`;
            if (!reload && selected && song[2].some(x => x[0].id === selected)) setHidden(Object.fromEntries(song[2].map(x => [x[0].id, x[0].id !== selected])));
            for (const s of song[2]) if (!players.includes(s[0].id)) new YT.Player('container-' + s[0].id, {
                width: 300,
                height: 150,
                videoId: song[0].youtube,
                playerVars: {
                    start: s[0].start,
                    end: s[0].end + 2,
                },
                events: {
                    onStateChange: e => {
                        if (!e.data) {
                            e.target.pauseVideo();
                            e.target.seekTo(s[0].start, true);
                        }
                    },
                },
            });
            setPlayers(song[2].map(x => x[0].id));
        }
    }, [song]);
    return song
        ? <>
            <div className='albumInfo'>
                <img src={song[1].cover}/>
                <div>
                    <h1>{song[0].name}</h1>
                    <h2><a className='label'>by</a> <a className='link' {...navigateOnClick([], [['artists', song[1].artist.toLowerCase()]])}>{song[1].artist}</a></h2>
                    <h2><a className='label'>on</a> <a className='link' {...navigateOnClick(['album', song[1].id])}>{song[1].name}</a></h2>
                </div>
            </div>
            <div>Genres: <LinkList arr={song[0].genres} query='genres'/></div>
            {
                admin
                    ? <>
                        <textarea defaultValue={JSON.stringify({
                            name: song[0].name,
                            youtube: song[0].youtube,
                            genres: song[0].genres,
                        }, undefined, 4)} ref={edit}/>
                        <br/>
                        <div className='row'>
                            <button onClick={() => {
                                const d = JSON.parse(edit.current!.value);
                                request('/admin/edit', { entry: ['songs', song[0].id], data: { ...d, lowerName: d.name.toLowerCase() } }, () => setReload(reload + 1));
                            }}>Edit</button>
                            <button onClick={() => confirm('Are you sure?') && request('/admin/delete/song', { id: song[0].id }, () => setReload(reload + 1))}>Delete</button>
                            {
                                song[0].unverified
                                    ? <button onClick={() => request('/admin/verify', { entry: ['songs', song[0].id] }, () => setReload(reload + 1))}>Verify</button>
                                    : ''
                            }
                        </div>
                    </>
                    : ''
            }
            {
                song[2].length
                    ? <>
                        <hr/>
                        {song[2].sort((a, b) => a[0].start - b[0].start).map(x => <div key={x[0].start}>
                            <div className='soloHeader'>
                                <h1 className='center'><a className={`link${x[0].id === selected ? ' underline' : ''}`} {...navigateOnClick(['song', song[0].id], [['solo', x[0].id]])}>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</a></h1>
                                <div><button onClick={() => setHidden({ ...hidden, [x[0].id]: !hidden[x[0].id] })}>{hidden[x[0].id] ? 'Show' : 'Hide'}</button></div>
                            </div>
                            <div style={{ display: hidden[x[0].id] ? 'none' : '' }}>
                                {(['guitarists', 'tags'] as const).map(k => x[0][k].length ? <div key={k}>{k[0].toUpperCase()}{k.slice(1, x[0][k].length === 1 ? -1 : undefined)}: <LinkList arr={x[0][k]} query={k}/></div> : '')}
                                <Ratings sum={x[2]} count={x[3]}/>
                                {
                                    loggedIn
                                        ? <>
                                            <label>Own rating: <input type='number' min={0} max={10} defaultValue={x[4]} ref={e => ratings[x[0].id] = e!} {...enterKeydown(rate(x))} className='num'/>/10</label>
                                            <button className='rate' onClick={rate(x)}>Rate</button>
                                            {Number.isInteger(x[4]) ? <> <button onClick={() => request('/unrate', { id: x[0].id }, () => setReload(reload + 1))}>Unrate</button></> : ''}
                                            {
                                                admin
                                                    ? <div className='row'>
                                                        <input defaultValue={JSON.stringify([...[x[0].start, x[0].end].map(t => getTimestamp(t).split(':').map(n => +n)), x[0].tags, x[0].guitarists])} className='soloInput' ref={e => solos[x[0].id] = e!}/>
                                                        <button onClick={() => {
                                                            const d = JSON.parse(solos[x[0].id].value);
                                                            request('/admin/edit', { entry: ['solos', x[0].id], data: { start: d[0][0] * 60 + d[0][1], end: d[1][0] * 60 + d[1][1], tags: d[2], guitarists: d[3] } }, () => setReload(reload + 1));
                                                        }}>Edit</button>
                                                        <button onClick={() => confirm('Are you sure?') && request('/admin/delete/solo', { id: x[0].id }, () => setReload(reload + 1))}>Delete</button>
                                                        {
                                                            x[0].unverified
                                                                ? <button onClick={() => request('/admin/verify', { entry: ['solos', x[0].id] }, () => setReload(reload + 1))}>Verify</button>
                                                                : ''
                                                        }
                                                    </div>
                                                    : ''
                                            }
                                        </>
                                        : <AuthText text='rate this solo'/>
                                }
                                <h3 className='center'>Audio</h3>
                                <div id={'container-' + x[0].id}/>
                                {
                                    x[1].length
                                        ? <>
                                            <h3 className='center'>Similar solos</h3>
                                            <Albums arr={x[1]} ts/>
                                        </>
                                        : ''
                                }
                            </div>
                        </div>)}
                    </>
                    : ''
            }
            <hr/>
            {
                loggedIn
                    ? <>
                        <h1>Add solo</h1>
                        <label>Start: <TimeInput _ref={startM} f={submit}/>:<TimeInput sec _ref={startS} f={submit}/></label>
                        <br/>
                        <label>End: <TimeInput _ref={endM} f={submit}/>:<TimeInput sec _ref={endS} f={submit}/></label>
                        <br/>
                        <a>Tags: </a> {tags.map((t, i) => <label key={t} className='tagLabel'><input type='checkbox' ref={tagRefs[i]}/>{t}</label>)}
                        <br/>
                        <label>Guitarists (leave empty if unknown): <input placeholder='Separated by ;' ref={guitarists} {...enterKeydown(submit)}/></label>
                        <br/>
                        <button onClick={submit}>Add</button>
                    </>
                    : <AuthText text='add solos to this song'/>
            }
        </>
        : error
            ? <h1>Song not found.</h1>
            : <></>;
};

type Data = [Song, Album, [Solo, Solos, number, number, number][]];
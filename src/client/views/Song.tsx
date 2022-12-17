import { MutableRefObject, useContext, useEffect, useRef, useState } from 'react';
import { Album, Solo, Song } from '../../types';
import Albums from '../components/Albums';
import Ratings from '../components/Ratings';
import { getSecs, getTimestamp, MainContext, Solos } from '../util';

const TimeInput = ({ _ref, sec }: { _ref: MutableRefObject<HTMLInputElement>; sec?: boolean; }) => <input type='number' min={0} max={sec ? 59 : null} className='num' ref={_ref}/>;

export default ({ id }: { id: string; }) => {
    const { request, navigate, loggedIn } = useContext(MainContext);
    const [reload, setReload] = useState(0);
    const [song, setSong] = useState<[Song, Album, [Solo, Solos, number, number, number][]]>();
    const startM = useRef<HTMLInputElement>();
    const startS = useRef<HTMLInputElement>();
    const endM = useRef<HTMLInputElement>();
    const endS = useRef<HTMLInputElement>();
    const ratings: Record<string, HTMLInputElement> = {};
    useEffect(() => {
        request<[Song, Album, [Solo, Solos, number, number, number][]]>('/get/song', { id }, x => setSong(x));
    }, [reload]);
    useEffect(() => {
        if (song) document.title = `${song[0].name} - ${song[1].artist} | Guitar Solos`;
    }, [song]);
    return song
        ? <>
            <div className='albumInfo'>
                <img src={song[1].cover}/>
                <div>
                    <h1>{song[0].name}</h1>
                    <h2><a className='label'>by</a> {song[1].artist}</h2>
                    <h2><a className='label'>on</a> <a onClick={() => navigate(['album', song[1].id])} className='link'>{song[1].name}</a></h2>
                </div>
            </div>
            <a>Genres: {song[0].genres.join(', ')}</a>
            {
                song[2].length
                    ? <>
                        <hr/>
                        {song[2].sort((a, b) => a[0].start - b[0].start).map(x => <div key={x[0].start}>
                            <h1 className='center'>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h1>
                            <Ratings sum={x[2]} count={x[3]}/>
                            {
                                loggedIn
                                    ? <>
                                        <label>Own rating: <input type='number' min={0} max={10} defaultValue={x[4]} ref={e => ratings[x[0].id] = e} className='num'/>/10</label>
                                        <button className='rate' onClick={() => request('/rate', { id: x[0].id, rating: +ratings[x[0].id].value }, () => setReload(reload + 1))}>Rate</button>
                                        <br/>
                                    </>
                                    : ''
                            }
                            <h3 className='center'>Audio</h3>
                            <iframe src={`https://www.youtube.com/embed/${song[0].youtube}?start=${x[0].start}`}/>
                            {
                                x[1].length
                                    ? <>
                                        <h3 className='center'>Similar solos</h3>
                                        <Albums arr={x[1]} ts/>
                                    </>
                                    : ''
                            }
                        </div>)}
                    </>
                    : ''
            }
            {
                loggedIn
                    ? <>
                        <hr/>
                        <h1>Add solo</h1>
                        <label>Start: <TimeInput _ref={startM}/>:<TimeInput sec _ref={startS}/></label>
                        <br/>
                        <label>End: <TimeInput _ref={endM}/>:<TimeInput sec _ref={endS}/></label>
                        <br/>
                        <button onClick={() => request('/add/solo', {
                            song: id,
                            start: getSecs(startM, startS),
                            end: +endM.current!.value * 60 + +endS.current!.value,
                        }, () => {
                            startM.current.value = startS.current.value = endM.current.value = endS.current.value = '';
                            setReload(reload + 1);
                        })}>Add</button>
                    </>
                    : <></>
            }
        </>
        : <></>;
};
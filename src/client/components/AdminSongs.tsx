import { useContext } from 'react';
import { Album, Song } from '../../types';
import { MainContext } from '../util';

export default ({ arr }: { arr: [Song, Album][]; }) => {
    const { navigate } = useContext(MainContext)!;
    return <>{arr.map((x, i) => <div key={i} onClick={() => navigate(['song', x[0].id])} className='link'>{x[0].name} <a className='label'>by</a> {x[1].artist}</div>)}</>;
};
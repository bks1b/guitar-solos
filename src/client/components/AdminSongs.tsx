import { useContext } from 'react';
import { Album, Song } from '../../util';
import { MainContext } from '../util';

export default ({ arr }: { arr: [Song, Album][]; }) => {
    const { navigateOnClick } = useContext(MainContext)!;
    return <>{arr.map((x, i) =>
        <div key={i} {...navigateOnClick(['song', x[0].id])} className='link'>
            {x[0].name} <a className='label'>by</a> {x[1].artist}
        </div>,
    )}</>;
};
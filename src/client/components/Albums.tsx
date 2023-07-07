import { useContext } from 'react';
import { getTimestamp, MainContext, Solos } from '../util';

export default ({ arr, navigateArtist, ratings, album, ts }: { arr: Solos; navigateArtist?: (a: string) => any; ratings?: boolean; album?: boolean; ts?: boolean; }) => {
    const { navigate } = useContext(MainContext)!;
    return <div className='smallAlbums'>{arr.map((x, i) => <div key={i}>
        <img src={x[2].cover} className='link' onClick={() => navigate(['album', x[2].id])}/>
        <h3 onClick={() => navigate([album ? 'album' : 'song', x[album ? 2 : 1].id])} className='link'>{x[album ? 2 : 1].name}</h3>
        <h3 className='link' onClick={() => (navigateArtist || (a => navigate([], [['artists', a]])))(x[2].artist.toLowerCase())}>{x[2].artist}</h3>
        {ts ? <h4>{getTimestamp(x[0].start)}-{getTimestamp(x[0].end)}</h4> : ''}
        {ratings ? <h4>{x[3]}/10</h4> : ''}
    </div>)}</div>;
};
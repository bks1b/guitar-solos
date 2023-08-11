import { useContext } from 'react';
import { MainContext } from '../util';

export default ({ text }: { text: string; }) => {
    const { setPopup } = useContext(MainContext)!;
    return <div><a className='link' onClick={() => setPopup('login')}>Log in</a> or <a className='link' onClick={() => setPopup('signup')}>sign up</a> to {text}.</div>;
};
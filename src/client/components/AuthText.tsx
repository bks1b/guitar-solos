import { useContext } from 'react';
import { MainContext } from '../util';

export default ({ text }: { text: string; }) => {
    const { navigateOnClick } = useContext(MainContext)!;
    return <div><a className='link underline' {...navigateOnClick(['login'])}>Log in</a> or <a className='link underline' {...navigateOnClick(['signup'])}>sign up</a> to {text}.</div>;
};
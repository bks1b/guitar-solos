import { useContext, useEffect, useRef } from 'react';
import { Auth, User } from '../../util';
import { MainContext, enterKeydown } from '../util';

export default ({ type }: { type: string; }) => {
    const { request, navigate, user, setUser } = useContext(MainContext)!;
    const username = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const desc = useRef<HTMLInputElement>(null);
    const isPublic = useRef<HTMLInputElement>(null);
    const submit = () => {
        const auth = [username.current!.value, password.current!.value] as Auth;
        request<User>('/auth/' + type, [...auth, desc.current?.value, isPublic.current?.checked], d => {
            localStorage.setItem('auth', JSON.stringify(auth));
            setUser({ loggedIn: true, auth, ...d });
            if (type === 'signup') navigate(['guide']);
            if (type === 'login') navigate(['profile', auth[0]]);
        });
    };
    const title = type === 'settings' ? 'Account settings' : type === 'login' ? 'Log in' : 'Sign up';
    useEffect(() => {
        document.title = title + ' | Guitar Solos';
    }, []);
    return <>
        <h1>{title}</h1>
        <label>Username: <input ref={username} defaultValue={user.loggedIn ? user.name : ''} {...enterKeydown(submit)}/></label>
        <br/>
        <label>Password: <input type='password' ref={password} defaultValue={user.loggedIn ? user.auth![1] : ''} {...enterKeydown(submit)}/></label>
        {
            type === 'login'
                ? ''
                : <>
                    <br/>
                    <label>Profile description <a className='label'>(optional)</a>: <input ref={desc} defaultValue={user.loggedIn ? user.description : ''} {...enterKeydown(submit)}/></label>
                    <br/>
                    <label><input type='checkbox' ref={isPublic} defaultChecked={user.loggedIn ? user.public : true}/> Profile can show up in search results</label>
                </>
        }
        <br/>
        <button onClick={submit}>{type === 'settings' ? 'Save' : type === 'login' ? 'Log in' : 'Sign up'}</button>
    </>;
};
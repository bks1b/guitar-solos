import { useContext, useEffect, useRef } from 'react';
import { User } from '../../util';
import { MainContext, enterKeydown, request } from '../util';

const zip = (arr: string[], type: string) => arr[['login', 'signup', 'settings'].indexOf(type)];

export default ({ type }: { type: string; }) => {
    const { navigate, user, setUser } = useContext(MainContext)!;
    const username = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const desc = useRef<HTMLInputElement>(null);
    const isPublic = useRef<HTMLInputElement>(null);
    const submit = () => request<User>('auth', zip(['PATCH', 'POST', 'PUT'], type), {
        name: username.current!.value,
        password: password.current!.value,
        description: desc.current?.value,
        public: isPublic.current?.checked,
    }).then(d => {
        setUser(d);
        if (type === 'signup') navigate(['guide']);
        if (type === 'login') navigate(['profile', username.current!.value]);
    });
    const title = zip(['Log in', 'Sign up', 'Account settings'], type);
    useEffect(() => {
        document.title = title + ' | Guitar Solos';
    }, []);
    return <>
        <h1>{title}</h1>
        <label>
            {'Username: '}
            <input ref={username} defaultValue={user?.name || ''} {...enterKeydown(submit)}/>
        </label>
        <br/>
        <label>
            {'Password: '}
            <input type='password' ref={password} {...enterKeydown(submit)}/>
        </label>
        {type === 'login' ? '' : <>
            <br/>
            <label>
                Profile description <a className='label'>(optional)</a>{': '}
                <input ref={desc} defaultValue={user?.description || ''} {...enterKeydown(submit)}/>
            </label>
            <br/>
            <label>
                <input type='checkbox' ref={isPublic} defaultChecked={!user || user.public}/>
                {' Profile can show up in search results'}
            </label>
        </>}
        <br/>
        <button onClick={submit}>{zip(['Log in', 'Sign up', 'Save'], type)}</button>
    </>;
};
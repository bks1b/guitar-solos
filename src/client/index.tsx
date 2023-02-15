import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { isMobile, MainContext, RequestFn } from './util';
import AddAlbum from './views/AddAlbum';
import Album from './views/Album';
import Charts from './views/Charts';
import Discover from './views/Discover';
import Profile from './views/Profile';
import Search from './views/Search';
import Song from './views/Song';

const App = () => {
    const request: RequestFn = (str, body, cb, err) => fetch('/api' + str, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            ...user.loggedIn ? { authorization: JSON.stringify(user.auth) } : {},
        },
        body: JSON.stringify(body),
    }).then(d => d.json()).then(d => {
        if (!d.error) return cb(d);
        else if (err) return err(d.error);
        else alert('Error: ' + d.error);
    });
    const getPath = () => decodeURIComponent(window.location.pathname).split('/').slice(1).filter(x => x);
    const navigate = (arr: string[], q?: string[][]) => {
        window.history.pushState('', '', '/' + arr.map(x => encodeURIComponent(x)).join('/') + (q ? '?' + new URLSearchParams(q) : ''));
        setPath(arr);
    };
    const [user, setUser] = useState<{
        loggedIn: boolean;
        auth?: string[];
        name?: string;
    }>({ loggedIn: false });
    const [path, setPath] = useState(getPath());
    const [sidebar, setSidebar] = useState(!isMobile);
    const [popup, setPopup] = useState<false | 'login' | 'signup' | 'edit'>(false);
    const [wait, setWait] = useState(!!localStorage.getItem('auth'));
    const username = useRef<HTMLInputElement>();
    const password = useRef<HTMLInputElement>();
    const search = useRef<HTMLInputElement>();
    useEffect(() => {
        window.onpopstate = () => setPath(getPath());
        try {
            const auth = JSON.parse(localStorage.getItem('auth'));
            if (auth) request<string>('/auth/login', auth, name => setUser({ loggedIn: true, auth, name }), () => localStorage.removeItem('auth')).finally(() => setWait(false));
        } catch {
            setWait(false);
        }
    }, []);
    return wait
        ? <></>
        : <MainContext.Provider value={{ request, navigate, loggedIn: user.loggedIn }}>
            {
                popup
                    ? <div className='popupContainer' onClick={e => {
                        if ((e.target as HTMLElement).className === 'popupContainer') setPopup(false);
                    }}>
                        <div className='popup'>
                            <label>Username: <input ref={username}/></label>
                            <br/>
                            <label>Password: <input type='password' ref={password}/></label>
                            <br/>
                            <button onClick={async () => {
                                const auth = [username.current!.value, password.current!.value];
                                request<string>('/auth/' + popup, auth, name => {
                                    localStorage.setItem('auth', JSON.stringify(auth));
                                    setUser({ loggedIn: true, auth, name });
                                    setPopup(false);
                                });
                            }}>{popup === 'edit' ? 'Save' : popup === 'login' ? 'Log in' : 'Sign up'}</button>
                        </div>
                    </div>
                    : ''
            }
            <div className='navbar'>
                <div className='toggleSidebar' onClick={() => setSidebar(!sidebar)}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div className='searchContainer'>
                    <input ref={search} onKeyDown={e => {
                        if (e.key === 'Enter') navigate(['search', search.current!.value]);
                    }}/>
                    <button onClick={() => navigate(['search', search.current!.value])}>Search</button>
                </div>
            </div>
            <div className='body'>
                {
                    sidebar
                        ? <div className='sidebar'>
                            {([
                                ...user.loggedIn ? [[user.name, ['profile', user.name]]] : [],
                                ['Charts', []],
                                ...user.loggedIn ? [
                                    ['Discover', ['discover']],
                                    ['Add album', ['add', 'album']],
                                ] : [],
                            ] as [string, string[]][]).map((x, i) => <div key={i} onClick={() => navigate(x[1])} className={path === x[1] ? 'selected' : ''}>{x[0]}</div>)}
                            {
                                user.loggedIn
                                    ? <>
                                        <div onClick={() => setPopup('edit')}>Account settings</div>
                                        <div onClick={() => {
                                            localStorage.removeItem('auth');
                                            setUser({ loggedIn: false });
                                        }}>Log out</div>
                                    </>
                                    : <>
                                        <div onClick={() => setPopup('login')}>Log in</div>
                                        <div onClick={() => setPopup('signup')}>Sign up</div>
                                    </>
                            }
                        </div>
                        : ''
                }
                <div className='contentContainer'><div className='content' key={JSON.stringify(path)}>{
                    (path.length === 2
                        ? path[0] === 'add' && path[1] === 'album' && user.loggedIn
                            ? <AddAlbum/>
                            : path[0] === 'album'
                                ? <Album id={path[1]}/>
                                : path[0] === 'song'
                                    ? <Song id={path[1]}/>
                                    : path[0] === 'profile'
                                        ? <Profile name={path[1]}/>
                                        : path[0] === 'search'
                                            ? <Search str={path[1]}/>
                                            : undefined
                        : path[0] === 'discover' && path.length === 1 && user.loggedIn
                            ? <Discover/>
                            : path.length ? undefined : <Charts/>) || <h1>Page not found.</h1>
                }</div></div>
            </div>
        </MainContext.Provider>;
};

createRoot(document.getElementById('root')).render(<App/>);
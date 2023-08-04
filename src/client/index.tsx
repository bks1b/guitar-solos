import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth, User } from '../types';
import { enterKeydown, isMobile, MainContext, onClick, RequestFn, resolvePath } from './util';
import AddAlbum from './views/AddAlbum';
import Album from './views/Album';
import Charts from './views/Charts';
import Discover from './views/Discover';
import Profile from './views/Profile';
import Search from './views/Search';
import Song from './views/Song';
import Stats from './views/Stats';
import Rules from './views/Rules';
import Admin from './views/Admin';
import Help from './views/Help';

let id = Date.now();
let lastStateStr = '';

const App = () => {
    const request: RequestFn = (str, body, cb, err) => fetch('/api' + str, {
        method: body ? 'POST' : 'GET',
        headers: {
            'content-type': 'application/json',
            ...user.loggedIn ? { authorization: JSON.stringify(user.auth) } : {},
        },
        body: body && JSON.stringify(body),
    }).then(d => d.json()).then(d => {
        if (!d.error) return cb(d);
        else if (err) return err(d.error);
        else alert('Error: ' + d.error);
    });
    const getPath = () => decodeURIComponent(window.location.pathname).split('/').slice(1).filter(x => x);
    const navigate = (arr: string[], q?: string[][]) => {
        window.history.pushState('', '', resolvePath(arr, q));
        setPath(arr);
    };
    const navigateOnClick = (arr: string[], q?: string[][]) => onClick(() => navigate(arr, q), () => window.open(resolvePath(arr, q)));
    const [user, setUser] = useState<{
        loggedIn: boolean;
        auth?: Auth;
        name?: string;
        public?: boolean;
        admin?: boolean;
    }>({ loggedIn: false });
    const [path, setPath] = useState(getPath());
    const [sidebar, setSidebar] = useState(!isMobile);
    const [popup, setPopup] = useState<false | 'login' | 'signup' | 'edit'>(false);
    const [wait, setWait] = useState(!!localStorage.getItem('auth'));
    const username = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const isPublic = useRef<HTMLInputElement>(null);
    const search = useRef<HTMLInputElement>(null);
    const submitPopup = () => {
        const auth = [username.current!.value, password.current!.value, { public: isPublic.current?.checked }] as Auth;
        request<User>('/auth/' + popup, auth, d => {
            localStorage.setItem('auth', JSON.stringify(auth));
            setUser({ loggedIn: true, auth, ...d });
            setPopup(false);
        });
    };
    useEffect(() => {
        window.onpopstate = () => setPath(getPath());
        try {
            const auth = JSON.parse(localStorage.getItem('auth')!);
            if (auth) request<[string, boolean]>('/auth/login', auth, d => setUser({ loggedIn: true, auth, ...d }), () => localStorage.removeItem('auth')).finally(() => setWait(false));
        } catch {
            setWait(false);
        }
        const observer = new MutationObserver(() => {
            const container = document.querySelector('.contentContainer') as HTMLElement;
            if (container) {
                observer.disconnect();
                (window.onresize = () => {
                    const h = window.innerHeight + 'px';
                    root.style.height = h;
                    container.style.height = `calc(${h} - ${getComputedStyle(container).getPropertyValue('--content-height-off')})`;
                })();
            }
        });
        observer.observe(document.body, {
            childList: true, 
            subtree: true,
        });
    }, []);
    const stateStr = JSON.stringify([sidebar, popup]);
    if (stateStr === lastStateStr) id = Date.now();
    lastStateStr = stateStr;
    return wait
        ? <></>
        : <MainContext.Provider value={{ request, navigate, navigateOnClick, loggedIn: user.loggedIn, admin: user.admin! }}>
            {
                popup
                    ? <div className='popupContainer' onClick={e => {
                        if ((e.target as HTMLElement).className === 'popupContainer') setPopup(false);
                    }}>
                        <div className='popup'>
                            <label>Username: <input ref={username} defaultValue={user.loggedIn ? user.name : ''} {...enterKeydown(submitPopup)}/></label>
                            <br/>
                            <label>Password: <input type='password' ref={password} {...enterKeydown(submitPopup)}/></label>
                            <br/>
                            {
                                popup === 'login'
                                    ? ''
                                    : <>
                                        <label><input type='checkbox' ref={isPublic} defaultChecked={user.loggedIn ? user.public : true}/> Profile can show up in search results</label>
                                        <br/>
                                    </>
                            }
                            <button onClick={submitPopup}>{popup === 'edit' ? 'Save' : popup === 'login' ? 'Log in' : 'Sign up'}</button>
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
                    <input ref={search} {...enterKeydown(() => navigate(['search', search.current!.value]))}/>
                    <button {...onClick(() => navigate(['search', search.current!.value]), () => window.open('/search/' + search.current!.value))}>Search</button>
                </div>
            </div>
            <div className='body'>
                {
                    sidebar
                        ? <div className='sidebar'>
                            {([
                                ...user.loggedIn ? [[user.name, ['profile', user.name]]] : [],
                                ['Charts', []],
                                ['Stats', ['stats']],
                                ...user.loggedIn ? [
                                    ['Discover', ['discover']],
                                    ['Add album', ['add', 'album']],
                                ] : [],
                                ['Help', ['help']],
                                ['Rules', ['rules']],
                                ...user.admin ? [['Admin', ['admin']]] : [],
                            ] as [string, string[]][]).map((x, i) => <div key={i} {...navigateOnClick(x[1], [])} className={path === x[1] ? 'selected' : ''}>{x[0]}</div>)}
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
                <div className='contentContainer'><div className='content' key={id}>{
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
                        : path.length === 1
                            ? path[0] === 'discover' && user.loggedIn
                                ? <Discover/>
                                : path[0] === 'stats'
                                    ? <Stats/>
                                    : path[0] === 'help'
                                        ? <Help/>
                                        : path[0] === 'rules'
                                            ? <Rules/>
                                            : path[0] === 'admin' && user.admin
                                                ? <Admin/>
                                                : undefined
                            : path.length ? undefined : <Charts/>) || <h1>Page not found.</h1>
                }</div></div>
            </div>
        </MainContext.Provider>;
};

const root = document.getElementById('root')!;

createRoot(root).render(<App/>);
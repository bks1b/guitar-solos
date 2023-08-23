import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { User } from '../util';
import { enterKeydown, isMobile, AuthState, MainContext, onClick, RequestFn, resolvePath } from './util';
import AddAlbum from './views/AddAlbum';
import Album from './views/Album';
import Charts from './views/Charts';
import Discover from './views/Discover';
import Profile from './views/Profile';
import Search from './views/Search';
import Song from './views/Song';
import Info from './views/Info';
import Admin from './views/Admin';
import Guide from './views/Guide';
import Auth from './components/Auth';

let id = Date.now();
let lastSidebar = !isMobile;

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
    const navigateOnClick = (arr: string[], q?: string[][]) => onClick(m => m ? window.open(resolvePath(arr, q)) : navigate(arr, q));
    const [user, setUser] = useState<AuthState>({ loggedIn: false });
    const [path, setPath] = useState(getPath());
    const [sidebar, setSidebar] = useState(lastSidebar);
    const [wait, setWait] = useState(!!localStorage.getItem('auth'));
    const [loaded, setLoaded] = useState(false);
    const search = useRef<HTMLInputElement>(null);
    const getSearchPath = () => ['search', search.current!.value];
    useEffect(() => {
        window.onpopstate = () => setPath(getPath());
        try {
            const auth = JSON.parse(localStorage.getItem('auth')!);
            if (auth) request<User>('/auth/login', auth, d => setUser({ loggedIn: true, auth, ...d }), () => localStorage.removeItem('auth')).finally(() => setWait(false));
        } catch {
            setWait(false);
        }
    }, []);
    if (!loaded) {
        const observer = new MutationObserver(() => {
            const container = document.querySelector('.contentContainer') as HTMLElement;
            if (container) {
                observer.disconnect();
                (window.onresize = () => setTimeout(() => {
                    const h = window.innerHeight + 'px';
                    root.style.height = h;
                    container.style.height = `calc(${h} - ${getComputedStyle(container).getPropertyValue('--content-height-off')})`;
                }))();
            }
        });
        observer.observe(document.body, {
            childList: true, 
            subtree: true,
        });
        setLoaded(true);
    }
    if (sidebar === lastSidebar) id = Date.now();
    lastSidebar = sidebar;
    return wait
        ? <></>
        : <MainContext.Provider value={{ request, navigate, navigateOnClick, user, setUser, loggedIn: user.loggedIn, admin: user.admin! }}>
            <div className='navbar'>
                <div className='toggleSidebar' onClick={() => setSidebar(!sidebar)}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div className='searchContainer'>
                    <input ref={search} {...enterKeydown(() => navigate(getSearchPath()))}/>
                    <button {...onClick(m => m ? window.open(resolvePath(getSearchPath())) : navigate(getSearchPath()))}>Search</button>
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
                                ['Guide and rules', ['guide']],
                                ...user.admin ? [['Admin', ['admin']]] : [],
                                ...user.loggedIn
                                    ? [['Account settings', ['settings']]]
                                    : [['Log in', ['login']], ['Sign up', ['signup']]],
                            ] as [string, string[]][]).map((x, i) => <div key={i} {...navigateOnClick(x[1], [])} className={path === x[1] ? 'selected' : ''}>{x[0]}</div>)}
                            {
                                user.loggedIn
                                    ? <div onClick={() => {
                                        localStorage.removeItem('auth');
                                        setUser({ loggedIn: false });
                                    }}>Log out</div>
                                    : ''
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
                                    ? <Info/>
                                    : path[0] === 'guide'
                                        ? <Guide/>
                                        : (user.loggedIn ? ['settings'] : ['login', 'signup']).includes(path[0])
                                            ? <Auth type={path[0]}/>
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
import { State, Route, RenderPageOptions, Json } from '../types.js';
import { store } from './store.js';
import { render } from './render.js';

export async function router(
    path: string,
    urlParams: string,
    options: RenderPageOptions) {
    const state: State = store.getState();
    const params = new URLSearchParams(urlParams);
    const requiresAuth = path.includes('/admin');
    const isLoggedIn = state.tenant.id ? true : false;
    const event_id = params.get('event_id');

    if (!event_id) {
        if (!isLoggedIn && path.includes('/register')) {
            renderRoute(path, '', options);
        } else {
            renderRoute('/home', '', options);
        }
        return;
    }

    if (state.dataIsStale) {
        const data: State | undefined = await fetchData(event_id);
        store.setState({
            ...state,
            ...data,
            dataIsStale: false
        });
    }

    // routing logic
    if (isLoggedIn) {
        if (path.includes('/register')) {
            renderRoute('/home', `event_id=${event_id}`, options);
        } else {
            renderRoute(path, params.toString(), options);
        }
    } else {
        if (requiresAuth) {
            renderRoute('/home', '', options);
        } else {
            renderRoute(path, params.toString(), options);
        }
    }
}

async function renderRoute(
    path: string,
    params: string,
    options: RenderPageOptions) {
    const route: Route = {
        view: path,
        params: params
    };

    window.scrollTo(0, 0);

    // calling render to generate HTML for current route
    await render(route, options);

    const url = (route.params.length > 0)
        ? `${route.view}?${route.params}`
        : route.view;

    // When the app loads from server we need to update browser history
    // by adding state to it, so when user returns to entry page via
    // back button, popState handler can access history to render page.
    // Here we use replaceState instead of pushState as we don't want
    // to add a new entry to history stack.
    if (options.type === 'click') {
        window.history.pushState(route, '', url);
    } else {
        window.history.replaceState(route, '', url);
    }
}

async function fetchData(event_id: string) {
    try {
        const response = await fetch(`/api/tournament?event_id=${event_id}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
        });
        const json: Json = await response.json();
        if (!json) throw ('Failed to fetch data from server!');
        if (json.error) {
            throw(json.message);
        } else {
            return json;
        }
    } catch (e) {
        console.error(` Error: ${e}`);
    }
}


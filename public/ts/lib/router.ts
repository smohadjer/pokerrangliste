import fetchData from './fetchData.js';
import { State, Route, RenderPageOptions } from './types.js';
import { store } from './store.js';
import { render } from './render.js';

export async function router(
    path: string,
    urlParams: string,
    options: RenderPageOptions) {
    console.log('router', path, urlParams);
    const state: State = store.getState();
    const params = new URLSearchParams(urlParams);
    const requiresAuth = path.indexOf('/admin') > -1;
    const loginOrRegister = path === '/login' || path === '/register';
    const isLoggedIn = state.tenant.id ? true : false;
    const event_id = params.get('event_id');

    if (!event_id) {
        if (loginOrRegister) {
            renderRoute(path, '', options);
        } else {
            renderRoute('/events', '', options);
        }
        return;
    }

    if (state.dataIsStale) {
        console.log('fetching data...');
        const data: State | undefined = await fetchData(event_id);
        store.setState(data);
        store.setState({
            dataIsStale: false
        })
    }

    // routing logic
    if (isLoggedIn) {
        if (loginOrRegister) {
            renderRoute('/admin/home', `event_id=${event_id}`, options);
        } else {
            renderRoute(path, params.toString(), options);
        }
    } else {
        if (requiresAuth) {
            renderRoute('/login', '', options);
        } else if (loginOrRegister) {
            renderRoute(path, '', options);
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

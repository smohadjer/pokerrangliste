import { State, Route, RenderPageOptions } from '../types';
import { store } from './store';
import { render } from './render';
import { setRankings, fetchData } from './utils';

export async function router(
    path: string,
    urlParams: string,
    options: RenderPageOptions) {
    const state: State = store.getState();
    const params = new URLSearchParams(urlParams);
    const requiresAuth = path.includes('/admin');
    const isLoggedIn = state.tenant.id ? true : false;
    const league_id = params.get('league_id')
        || window.localStorage.getItem('league_id');

    // if there is no league_id we should always redirect users to home so they
    // can select a league first unless user is a guest (not-logged)
    // on register or login page which no redirect is needed
    if (!league_id) {
        if (!isLoggedIn &&
            (path.includes('/register') || path.includes('/login'))) {
            renderRoute(path, '', options);
        } else {
            renderRoute('/home', '', options);
        }

        return;
    }

    // add league_id to url if it's missing in url params
    if (!params.get('league_id')) {
        params.set('league_id', league_id);
    }

    if (state.dataIsStale) {
        console.log('data is stale');
        const data: State | undefined = await fetchData(league_id);
        store.setState({
            ...state,
            ...data,
            dataIsStale: false
        });

        // if a season is not provided in URL check whether a season in db
        // is set as default
        if (!params.get('season_id')) {
            const defaultSeaon = data?.seasons.find(item => item?.default === true);
            if (defaultSeaon) {
                params.set('season_id', defaultSeaon._id);
            } else {
                params.set('season_id', 'all_time');
            }
        }

        // cache season rankings in state for better performance
        const season_id = params.get('season_id')!;
        setRankings(season_id);
    }

    // routing logic
    if (isLoggedIn) {
        if (path.includes('/register') || path.includes('/login')) {
            await renderRoute('/home', `league_id=${league_id}`, options);
        } else {
            await renderRoute(path, params.toString(), options);
        }
    } else {
        if (requiresAuth) {
            await renderRoute('/home', '', options);
        } else {
            await renderRoute(path, params.toString(), options);
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

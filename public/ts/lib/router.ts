import fetchData from './fetchData.js';
import { renderPage } from './renderPage.js';
import { State, Route, RenderPageOptions } from './types.js';
import { store } from './store.js';

const fetchSaveData = async (tenant_id: string, type: string) => {
    // app starting for first time such as on page refresh meaning we don't have data in state
    if (type === 'reload') {
        const data: State | undefined = await fetchData(tenant_id);
        store.setState(data);
    }
}

const renderDashboard = async (tenant_id: string, options: RenderPageOptions) => {
    const params = new URLSearchParams(`tenant_id=${tenant_id}`);
    let url = '/admin/home';
    await fetchSaveData(tenant_id, options.type);
    const route: Route = {
        view: url,
        params: params.toString()
    };
    await renderPage(route, options);
    if (route.params.length > 0) {
        url += '?' + params.toString();
    }
    window.history.replaceState(route, '', url);
}

export async function router(
    path: string,
    urlParams: string,
    options: RenderPageOptions) {
    const state: State = store.getState();
    const params = new URLSearchParams(urlParams);
    const requiresAuth = path.indexOf('/admin') > -1;
    const loginOrRegister = path.indexOf('login') > -1
        || path.indexOf('register') > -1;

    try {
        if (requiresAuth) { // private routes
            if (state.tenant.id) {
                await fetchSaveData(state.tenant.id, options.type);
                params.set('tenant_id', state.tenant.id);
                renderRoute(path, params, options);
            } else {
                renderLoginPage(options);
            }
        } else { // public routes
            if (loginOrRegister) {
                if (state.tenant.id) {
                    renderDashboard(state.tenant.id, options);
                } else {
                    renderLoginPage(options);
                }
            } else {
                const tenant_id = params.get('tenant_id');
                if (tenant_id) {
                    console.log('url has tenant_id');
                    await fetchSaveData(tenant_id, options.type);
                    renderRoute(path, params, options);
                } else {
                    console.log('url has no tenant_id');
                    renderLoginPage(options);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function renderLoginPage(options: RenderPageOptions) {
    const route: Route = {
        view: '/login',
        params: ''
    };
    await renderPage(route, options);
    const url = route.view;
    if (options.type === 'click') {
        window.history.pushState(route, '', url);
    } else {
        window.history.replaceState(route, '', url);
    }
}

async function renderRoute(
    path: string,
    params: URLSearchParams,
    options: RenderPageOptions) {
    // calling renderPage to generate HTML for current route
    // we convert params to string since history methods throw error when
    // cloning a URLSearchParam object
    const route: Route = {
        view: path,
        params: params.toString()
    };
    window.scrollTo(0, 0);
    await renderPage(route, options);

    if (params.get('tenant_id') && window.location.search.indexOf('tenant_id')) {

    }

    // When the app loads from server we need to update browser history
    // by adding state to it, so when user returns to entry page via
    // back button, popState handler can access history to render page.
    // Here we use replaceState instead of pushState as we don't want
    // to add a new entry to history stack.
    const url = `${route.view}?${route.params}`;
    if (options.type === 'click') {
        window.history.pushState(route, '', url);
    } else {
        window.history.replaceState(route, '', url);
    }
}

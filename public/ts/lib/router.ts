import fetchData from './fetchData.js';
import { State, RenderPageOptions } from './types.js';
import { store } from './store.js';
import { renderRoute } from './renderRoute.js';

export async function router(
    path: string,
    urlParams: string,
    options: RenderPageOptions) {
    console.log('router', path, urlParams);
    const state: State = store.getState();
    const params = new URLSearchParams(urlParams);
    const requiresAuth = path.indexOf('/admin') > -1;
    const loginOrRegisterOrTenantPage = path.indexOf('/login') > -1
        || path.indexOf('/register') > -1
        || path.indexOf('/events') > -1;
    const isLoggedIn = state.tenant.id ? true : false;
    // const tenant_id = state.tenant.id || params.get('tenant_id');
    const event_id = params.get('event_id');

    // if (!tenant_id) {
    //     if (path === '/register' || path === '/login') {
    //         renderRoute(path, '', options);
    //     } else {
    //         renderRoute('/tenant', '', options);
    //     }
    //     return;
    // }

    if (!event_id) {
        if (path === '/register' || path === '/login') {
            renderRoute(path, '', options);
        } else {
            renderRoute('/events', '', options);
        }
        return;
    }

    // if (requiresAuth) {
    //     params.set('tenant_id', tenant_id);
    // }

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
        if (loginOrRegisterOrTenantPage) {
            renderRoute('/admin/home', `event_id=${event_id}`, options);
        } else {
            // we convert params to string since history methods throw error when cloning a URLSearchParam object
            renderRoute(path, params.toString(), options);
        }
    } else {
        if (requiresAuth) {
            renderRoute('/login', '', options);
        } else if (loginOrRegisterOrTenantPage) {
            renderRoute(path, '', options);
        } else {
            renderRoute(path, params.toString(), options);
        }
    }
}

import fetchData from './fetchData.js';
import { State, RenderPageOptions } from './types.js';
import { store } from './store.js';
import { renderRoute } from './renderRoute.js';

export async function router(
    path: string,
    urlParams: string,
    options: RenderPageOptions) {
    const state: State = store.getState();
    const params = new URLSearchParams(urlParams);
    const requiresAuth = path.indexOf('/admin') > -1;
    const loginOrRegisterPage = path.indexOf('login') > -1
        || path.indexOf('register') > -1;
    const isLoggedIn = state.tenant.id ? true : false;
    const tenant_id = state.tenant.id || params.get('tenant_id');

    if (!tenant_id) {
        if (path === '/register' || path === '/login') {
            renderRoute(path, '', options);
        } else {
            renderRoute('/tenant', '', options);
        }
        return;
    }

    if (requiresAuth) {
        params.set('tenant_id', tenant_id);
    }

    if (state.dataIsStale) {
        console.log('fetching data...');
        const data: State | undefined = await fetchData(tenant_id);
        store.setState(data);
        store.setState({
            dataIsStale: false
        })
    }

    // routing logic
    if (isLoggedIn) {
        if (loginOrRegisterPage) {
            renderRoute('/admin/home', `tenant_id=${tenant_id}`, options);
        } else {
            // we convert params to string since history methods throw error when cloning a URLSearchParam object
            renderRoute(path, params.toString(), options);
        }
    } else {
        if (requiresAuth || loginOrRegisterPage) {
            if (path === '/register') {
                renderRoute(path, '', options);
            } else {
                renderRoute('/login', '', options);
            }
        } else {
            renderRoute(path, params.toString(), options);
        }
    }
}

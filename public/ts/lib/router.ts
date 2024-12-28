import fetchData from './fetchData.js';
import { State, RenderPageOptions } from './types.js';
import { store } from './store.js';
import { renderRoute } from './renderRoute.js';

let dataIsInState = false;

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
        renderRoute('/login', '', options);
        return;
    }

    if (requiresAuth) {
        params.set('tenant_id', tenant_id);
    }

    if (!dataIsInState) {
        console.log('fetching data for the first time...');
        const data: State | undefined = await fetchData(tenant_id);
        store.setState(data);
        dataIsInState = true;
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
            renderRoute('/login', '', options);
        } else {
            renderRoute(path, params.toString(), options);
        }
    }
}

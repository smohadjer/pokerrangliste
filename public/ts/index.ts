import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';
import { isAuthenticated } from './utils.js';
import { setHandlebars } from './lib/setHandlebars.js';
import { store } from './lib/store.js';
import { State, Route } from './lib/types.js';
import { renderPage } from './lib/renderPage.js';

const init = async () => {
    console.log('init app...', window.location.pathname);

    // registering helpers and partials needed for using Handlebars templating engine
    await setHandlebars();

    // registering event listeners for clicks on links and popstate event to avoid browser reloading pages from server
    enableSpaMode();

    try {
        const path = window.location.pathname;
        const requiresAuth = path.indexOf('admin') > -1;
        const state: State = store.getState();

        // authenticate with server
        if (requiresAuth && !state.authenticated) {
            const authenticated = await isAuthenticated();
            store.setState({ authenticated });
        }

        // if path requires authentication and user is not authenticated redirect to login page
        if (requiresAuth && !store.getState().authenticated) {
            const route: Route = {
                view: '/login',
                params: ''
            };
            await renderPage(route);
            window.history.replaceState(route, '', route.view);
        } else {
            const params = new URLSearchParams(window.location.search);
            const tenant_id = params.get('tenant_id');
            console.log({tenant_id});

            // all pages except login and register should have tenant_id as parameter in url
            if (!tenant_id && path.indexOf('login') < 0 && path.indexOf('register') < 0) {
                alert('This is not a valid URL. Ask your tournament organizer to send  you a proper url containing a tenant_id');
                window.location.href = '/login';
                return;
            }

            // fetch app data from server and storing it in state
            if (tenant_id ) {
                const stateData: State | undefined = await fetchData(tenant_id);
                store.setState(stateData);
                console.log('state before page render: ', store.getState());
            }

            // calling renderPage to generate HTML for current route
            // we convert params to string since history methods throw error when
            // cloning a URLSearchParam object
            const route: Route = {
                view: window.location.pathname,
                params: params.toString()
            };

            await renderPage(route);

            // When the app loads from server we need to update browser history
            // by adding state to it, so when user returns to entry page via
            // back button, popState handler can access history to render page.
            // Here we use replaceState instead of pushState as we don't want
            // to add a new entry to history stack.
            window.history.replaceState(route, '');
        }
    } catch (error) {
        console.error(error);
    }
};

// initializing app
init();

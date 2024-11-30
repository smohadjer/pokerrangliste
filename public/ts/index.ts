import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';
import { setHandlebars, getRouteParams } from './lib/utils.js';
import { store } from './lib/store.js';
import { State, Route } from './lib/types.js';
import { renderPage } from './lib/renderPage.js';
import { isAuthenticated } from './lib/utils.js';

const init = async () => {
    console.log('init app...', window.location.pathname);

    // registering helpers and partials needed for using Handlebars templating engine
    await setHandlebars();

    // registering event listeners for clicks on links and popstate event to avoid browser reloading pages from server
    enableSpaMode();

    console.log('SPA mode is enabled');

    try {
        // fetching app data from server and storing it in state
        const stateData: State | undefined = await fetchData();
        store.setState(stateData);

        const path = window.location.pathname;

        const requiresAuth = path.indexOf('admin') > -1;

        // if path requires authentication and user is not authenticated redirect to login page
        if (requiresAuth && !await isAuthenticated()) {
            const route: Route = {view: '/login', params: {}};
            await renderPage(route);
            window.history.replaceState(route, '', route.view);
        } else {
            // calling renderPage to generate HTML for current route
            const route: Route = {
                view: window.location.pathname,
                params: getRouteParams(window.location.search)
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

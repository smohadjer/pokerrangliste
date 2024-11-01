import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';
import { setHandlebars, getRouteParams } from './lib/utils.js';
import { store } from './lib/store.js';
import { State, Route } from './lib/types.js';
import { renderPage } from './lib/renderPage.js';

const init = async () => {
    // registering helpers and partials needed for using Handlebars templating engine
    await setHandlebars();

    // registering event listeners for clicks on links and popstate event to avoid browser reloading pages from server
    enableSpaMode();

    try {
        // fetching app data from server and storing it in state
        const stateData: State | undefined = await fetchData();
        store.setState(stateData);

        // calling renderPage to generate HTML for current route
        const route: Route = {
            view: window.location.pathname === '/' ? 'ranking' : window.location.pathname.substring(1),
            params: getRouteParams(window.location.search)
        };
        renderPage(route);

        // When the app loads from server we need to update browser history
        // by adding state to it, so when user returns to entry page via
        // back button, popState handler can access history to render page.
        // Here we use replaceState instead of pushState as we don't want
        // to add a new entry to history stack.
        window.history.replaceState(route, '');
    } catch (error) {
        console.error(error);
    }
};

// initializing app
init();

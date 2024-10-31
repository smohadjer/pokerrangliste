import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';
import { setHandlebars, getRouteParams } from './lib/utils.js';
import { store } from './lib/store.js';
import { Data, Route } from './lib/types.js';
import { renderPage } from './lib/renderPage.js';

(async () => {
    // registering handlebars helpers and partials
    await setHandlebars();

    // registers event handlers for click and popstate events
    enableSpaMode();

    try {
        const data: Data | undefined = await fetchData();
        const route: Route = {
            view: window.location.pathname === '/' ? 'ranking' : window.location.pathname.substring(1),
            params: getRouteParams(window.location.search)
        };

        store.setState(data);
        renderPage({}, route);

        // When the app loads from server we need to update browser history
        // by adding state to it, so when user returns to entry page via
        // back button, popState handler can access history to render page.
        // Here we use replaceState instead of pushState as we don't want
        // to add a new entry to history stack.
        window.history.replaceState(route, '', window.location.search);

        console.log(store.getState());
    } catch (error) {
        console.error(error);
    }
})();

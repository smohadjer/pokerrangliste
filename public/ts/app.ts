import enableSpaMode from './lib/enableSpaMode.js';
import { setHandlebars } from './lib/setHandlebars.js';
import { router } from './lib/router.js';
import { RenderPageOptions } from './lib/types.js';
import { store } from './lib/store.js';
import { fetchEvents, isAuthenticated } from './lib/utils.js';

(async () => {
    console.log('initilizing app');

    // registering helpers and partials needed for using Handlebars templating engine
    await setHandlebars();

    // registering event listeners for clicks on links and popstate event to avoid browser reloading pages from server
    enableSpaMode();

    const options: RenderPageOptions = {
        type: 'reload'
    };

    // fetching and storing events in state
    const authenticated = await isAuthenticated();
    if (authenticated.error) {
        // user is not logged in, fetching all events
        await fetchEvents();
    } else {
        // user is logged-in, saving user's name and id to state
        store.setState({tenant: authenticated});

        // fetch logged-in user's events
        await fetchEvents(authenticated.id);
    }

    router(window.location.pathname, window.location.search, options);
})();

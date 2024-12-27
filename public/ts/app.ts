import enableSpaMode from './lib/enableSpaMode.js';
import { setHandlebars } from './lib/setHandlebars.js';
import { router } from './lib/router.js';
import { RenderPageOptions } from './lib/types.js';
import { isAuthenticated } from './utils.js';
import { store } from './lib/store.js';

(async () => {
    console.log('initilizing app');

    // registering helpers and partials needed for using Handlebars templating engine
    await setHandlebars();

    // registering event listeners for clicks on links and popstate event to avoid browser reloading pages from server
    enableSpaMode();

    const options: RenderPageOptions = {
        type: 'reload'
    };

    type Tenant = {
        id: string;
        name: string;
    }

    // if user has a valid token save tenant from token to state
    const data: {tenant: Tenant} = await isAuthenticated();
    if (data?.tenant) {
        store.setState(data);
    }

    router(window.location.pathname, window.location.search, options);
})();

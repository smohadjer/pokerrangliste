import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';
import { setHandlebars } from './lib/utils.js';
import { store } from './lib/store.js';

const init = async() => {
    console.log('init', window.location.search);
    const urlParams = new URLSearchParams(window.location.search);
    //const redirect = urlParams.get('redirect');
    const view = window.location.pathname === '/' ? 'ranking' : window.location.pathname.substring(1);

    const payload = {
        view,
        season_id: urlParams.get('season_id') || undefined,
        tournament_id: urlParams.get('tournament_id') || undefined,
        player_id: urlParams.get('player_id') || undefined,
    }

    store.setState({ payload });
    await setHandlebars();
    enableSpaMode();
    await fetchData();

    const state = store.getState();
    console.log(state);

    // When the app loads from server we need to update browser history
    // by adding state to it, so when user returns to entry page via
    // back button, popState handler can access history to render page.
    // Here we use replaceState instead of pushState as we don't want
    // to add a new entry to history stack.
    window.history.replaceState(state, '', window.location.search);
};

init();

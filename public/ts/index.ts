import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';
import { setHandlebars } from './lib/utils.js';
import { store } from './lib/store.js';
import { onChangeEventHandler } from './lib/nav.js';

const init = async() => {
    const defaultView = 'ranking'
    const urlParams = new URLSearchParams(window.location.search);
    const payload = {
        view: urlParams.get('view') || defaultView,
        season_id: urlParams.get('season_id') || undefined,
        tournament_id: urlParams.get('tournament_id') || undefined,
        player_id: urlParams.get('player_id') || undefined,
    }

    store.setState({ payload });
    await setHandlebars();
    enableSpaMode();
    await fetchData();

    // set event listener for season selector in nav
    document.addEventListener('change', (event) => {
        if (event.target instanceof HTMLSelectElement) {
            onChangeEventHandler(event.target);
        }
    });

    document.getElementById('results')?.addEventListener('animationend', (event) => {
        console.log('animaiton end');
        const container = event.target as HTMLElement;
        container.classList.remove('slideInRTL');
        container.classList.remove('slideInLTR');
        container.classList.remove('fadeIn');
    })

    // When the app loads from server we need to update browser history
    // by adding state to it, so when user returns to entry page via
    // back button, popState handler can access history to render page.
    // Here we use replaceState instead of pushState as we don't want
    // to add a new entry to history stack.
    window.history.replaceState(store.getState(), '', window.location.search);
};

init();

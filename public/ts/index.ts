import { renderPage } from './lib/utils.js';
import { addNavigation} from './lib/nav.js';
import { Data, State } from './lib/definitions';

const DEFAULT_VIEW = 'ranking'

const urlParams = new URLSearchParams(window.location.search);

// initial state of the app
const state: State = {
    view: urlParams.get('view') || DEFAULT_VIEW,
    season_id: urlParams.get('season_id') || undefined,
    tournament_id: urlParams.get('tournament_id') || undefined,
    player_id: urlParams.get('player_id') || undefined,
    data: undefined
};

enableSpaMode();
fetchData();

function enableSpaMode() {
    document.querySelector('main')?.addEventListener('click', (e) => {
        const link = e.target as HTMLAnchorElement;
        if (link.nodeName === 'A') {
            e.preventDefault();

            const href = link.getAttribute('href')!;

            // Do nothing when link to current page is clicked
            if (link.search === window.location.search) {
                return;
            }

            const params = new URLSearchParams(link.search);

            // for browsers not supporting URLSearchParams's size property
            const size = (params.size)
                ? params.size
                : params.toString().length;

            if (size > 0) {
                for (const [key, value] of params) {
                    state[key] = value;
                }
            } else {
                // If there is no "view" query in url, set "view" to default
                // This is special case to allow links to homepage of app direct
                // to it without a "view" parameter.
                state.view = DEFAULT_VIEW
            }

            renderPage(state);
            window.history.pushState(state, '', href);
        }
    });

    window.addEventListener("popstate", function(e) {
        renderPage(e.state);
    });
}

function fetchData() {
    fetch('/api/tournament', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
    .then((response) => response.json())
    .then(async (json: Data) => {
        console.log({json});
        await addNavigation(json.seasons, state.season_id, urlParams);
        if (json.error) {
            alert(json.message);
        } else {
            state.data = json;
            renderPage(state);

            // When the app loads from server we need to update browser history
            // by adding state to it, so when user returns to entry page via
            // back button, popState handler can access history to render page.
            // Here we use replaceState instead of pushState as we don't want
            // to add a new entry to history stack.
            window.history.replaceState(state, '', window.location.search);
        }
    }).catch(function(err) {
        console.error(` Err: ${err}`);
    });
}

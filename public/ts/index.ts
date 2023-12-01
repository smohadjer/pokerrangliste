import { renderPage } from './lib/utils.js';
import { addNavigation} from './lib/nav.js';
import { Data, State } from './lib/definitions';

const urlParams = new URLSearchParams(window.location.search);

// set app's initial state
const state: State = {
    view: urlParams.get('view') || 'ranking',
    season_id: urlParams.get('season_id') || undefined,
    tournament_id: urlParams.get('tournament_id') || undefined,
    player_id: urlParams.get('player_id') || undefined,
    data: undefined
};

enableSpaMode();

function enableSpaMode() {
    document.querySelector('main')?.addEventListener('click', (e) => {
        const link = e.target as HTMLAnchorElement;
        if (link.nodeName === 'A') {
            e.preventDefault();
            const href = link.search;
            const params = new URLSearchParams(href);
            for (const [key, value] of params) {
                state[key] = value;
            }
            renderPage(state);
            window.history.pushState(state, '', '/?' + params.toString());
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
        console.log(json);
        await addNavigation(json.seasons, state.season_id, urlParams);
        if (json.error) {
            alert(json.message);
        } else {
            state.data = json;
            renderPage(state);
        }
    }).catch(function(err) {
        console.error(` Err: ${err}`);
    });
}

fetchData();

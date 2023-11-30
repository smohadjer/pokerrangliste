import { renderPage } from './lib/utils.js';
import { addNavigation} from './lib/nav.js';
import { JsonData, State } from './lib/definitions';

const urlParams = new URLSearchParams(window.location.search);
const state: State = {
    view: urlParams.get('view') || 'ranking',
    seasonId: urlParams.get('season_id') || undefined,
    tournament_id: urlParams.get('tournament_id') || undefined,
    player_id: urlParams.get('player_id') || undefined,
    spa: urlParams.get('spa') || 'false'
};

if (urlParams.get('spa')) {
    console.log('SPA mode is on');
    enableSpaMode();
}

function enableSpaMode() {
    document.addEventListener('click', (e) => {
        const link = e.target as HTMLAnchorElement;
        if (link.nodeName === 'A') {
            e.preventDefault();
            const href = link.search;
            const params = new URLSearchParams(href);
            for (const [key, value] of params) {
                state[key] = value;
            }
            renderPage(state);
            console.log(state);
            window.history.pushState(state, state.view , link.getAttribute('href'));
        }
    });

    window.addEventListener("popstate", function(e) {
        renderPage(e.state);
    });
}

const fetchData = () => {
    fetch('/api/tournament', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
    .then((response) => response.json())
    .then(async (json: JsonData) => {
        console.log(json);
        await addNavigation(json.seasons, state.seasonId, urlParams);
        if (json.error) {
            alert(json.message);
        }
        if (json.tournaments) {
            state.json = json;
            renderPage(state);
        } else {
          // if user navigates to another page immediately after fetchDate() is invoked
          // json is empty so we need to invoke fetchData() again
          //fetchData();
        }
    }).catch(function(err) {
        console.error(` Err: ${err}`);
    });
}

fetchData();

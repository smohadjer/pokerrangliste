import { Data, State } from './types.js';
import { renderPage } from './utils.js';
import { onChangeEventHandler } from './nav.js';

export default function fetchData(state: State) {
    fetch('/api/tournament', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
    .then((response) => response.json())
    .then(async (json: Data) => {
        if (json.error) {
            console.error(json.message);
        } else {
            state.data = json;

            // if no season_id is set, set season to last season entered in database
            if (!state.season_id) {
                const id = json.seasons[json.seasons.length - 1]._id;
                state.season_id = id;
            }

            renderPage(state);

            // set event listener for season selector in nav
            document.addEventListener('change', (event) => {
                if (event.target instanceof HTMLSelectElement) {
                    onChangeEventHandler(event.target, state);
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
            window.history.replaceState(state, '', window.location.search);
        }
    }).catch(function(err) {
        console.error(` Err: ${err}`);
    });
}

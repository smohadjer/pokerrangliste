import { Data } from './types.js';
import { renderPage } from './renderPage.js';
import { onChangeEventHandler } from './nav.js';
import { store } from './store.js';

export default function fetchData() {
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
            const payload: {data: Data, season_id?: string} = {
                data: json
            };

            // if no season_id is set, set season to last season entered in database
            if (!store.getState().season_id) {
                const id = json.seasons[json.seasons.length - 1]._id;
                payload.season_id = id;
            }

            store.setState({
                payload,
                action: renderPage
            })

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
        }
    }).catch(function(err) {
        console.error(` Err: ${err}`);
    });
}

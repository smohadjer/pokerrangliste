import { renderPage } from './lib/utils.js';
import { onChangeEventHandler } from './lib/nav.js';
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
    document.querySelector('main')?.addEventListener('click', async (e) => {
        const link = e.target as HTMLAnchorElement;
        if (link.nodeName === 'A') {
            e.preventDefault();

            // replace existing history state with one that has scrolling position
            const scrollPosition = document.documentElement.scrollTop;
            const tempState = {...history.state, scroll: scrollPosition};
            history.replaceState(tempState, '', window.location.search);

            const href = link.getAttribute('href')!;
            const options: { animation?: string} = {};
            const animatonClass = link.getAttribute('data-animation');
            if (animatonClass) {
                options.animation = animatonClass;
            }

            // Do nothing when link to current page is clicked
            if (link.search === window.location.search) {
                return;
            }

            const params = new URLSearchParams(link.search);

            // for browsers not supporting URLSearchParams's size property
            const size = (params.size)
                ? params.size
                : params.toString().length;

            // update state
            if (size > 0) {
                for (const [key, value] of params) {
                    state[key] = value;
                }
            }

            if (!params.get('view')) {
                state.view = DEFAULT_VIEW;
            }

            let url = '/';
            if (params.toString().length > 0) {
              url = '/?' +  params.toString();
            }

            window.scrollTo(0, 0);
            await renderPage(state, options);
            window.history.pushState(state, '', url);
        }
    });

    window.addEventListener("popstate", async (event) => {
        await renderPage(event.state);
        if (event.state.scroll) {
            window.scrollTo(0, event.state.scroll);
        }
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
        if (json.error) {
            alert(json.message);
        } else {
            state.data = json;

            // if no season_id is set, set season to last season entered in database
            if (!state.season_id) {
                const id = json.seasons[json.seasons.length - 1]._id;
                state.season_id = id;
            }

            renderPage(state);

            // set event listener for season selector in nav
            document.querySelector('nav')?.addEventListener('change', (event) => {
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

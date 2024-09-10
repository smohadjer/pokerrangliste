import { State } from './lib/types.js';
import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';
import { setHandlebars } from './lib/utils.js';

const urlParams = new URLSearchParams(window.location.search);
const state: State = {
    view: urlParams.get('view'),
    season_id: urlParams.get('season_id') || undefined,
    tournament_id: urlParams.get('tournament_id') || undefined,
    player_id: urlParams.get('player_id') || undefined,
    defaultView: 'ranking'
};

(async () => {
    await setHandlebars();
    enableSpaMode(state);
    fetchData(state);
})();






import { State } from './lib/definitions.js';
import enableSpaMode from './lib/enableSpaMode.js';
import fetchData from './lib/fetchData.js';

const urlParams = new URLSearchParams(window.location.search);
const $main = document.querySelector('main');
const state: State = {
    view: urlParams.get('view'),
    season_id: urlParams.get('season_id') || undefined,
    tournament_id: urlParams.get('tournament_id') || undefined,
    player_id: urlParams.get('player_id') || undefined,
    defaultView: 'ranking'
};

if ($main) {
    enableSpaMode(state, $main);
    fetchData(state);
}


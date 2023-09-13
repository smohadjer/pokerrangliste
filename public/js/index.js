import {
    renderRanking,
    renderTournament,
    renderGamesList,
    renderProfile
} from './lib/utils.js';

Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const tournamentId = urlParams.get('id');
const playerId = urlParams.get('playerId');
const view = urlParams.get('view');

fetch('/api/fetch.js', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({id: tournamentId})
  })
.then((response) => response.json())
.then((json) => {
    const data = json.data;
    if (data.length) {
        if (playerId) {
            renderProfile(data, playerId);
        } else {
            if (view === 'tournaments') {
                renderGamesList(data);
            } else {
                renderRanking(data);
            }
        }
    } else {
        // rendering result of single tournament
        renderTournament(data);
    }
});

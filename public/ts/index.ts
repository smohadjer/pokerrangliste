import {
    renderRanking,
    renderTournament,
    renderGamesList,
    renderProfile
} from './lib/utils.js';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const id = urlParams.get('id');
const playerId = urlParams.get('playerId');

fetch('/api/fetch.js', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({id: id})
  })
.then((response) => response.json())
.then((json) => {
    const data = json.data;
    if (data.length) {
        if (playerId) {
            renderProfile(data, playerId);
        } else {
            renderRanking(data);
            renderGamesList(data);
        }
    } else {
        renderTournament(data);
    }
});

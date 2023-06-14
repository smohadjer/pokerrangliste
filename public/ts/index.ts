import { renderRanking, renderTournament, renderGamesList } from './lib/utils.js';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const id = urlParams.get('id');

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
        renderRanking(data);
        renderGamesList(data);
    } else {
        renderTournament(data);
    }
});

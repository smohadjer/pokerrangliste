import { renderPage } from './lib/utils.js';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const tournamentId = urlParams.get('id');
const playerId = urlParams.get('playerId');
const view = urlParams.get('view') || 'ranking';
const db = urlParams.get('db');

let seasonId = urlParams.get('seasonId');
var seasonName = 'All-Time';

/*
const nav = document.querySelector('nav');
nav.addEventListener('click', (event) => {
    if(event.target.tagName === 'A') {
        const href = event.target.getAttribute('href');
        event.preventDefault();
        console.log('click', event.target);
        window.location = href;
    }
});
*/

const seasonSelector = document.querySelector('#seasons');
if (db) {
    seasonSelector.removeAttribute('hidden');
    seasonSelector.addEventListener('change', (event) => {
        const resultsElement = document.querySelector('#results');
        resultsElement.innerHTML = '';
        resultsElement.classList.add('empty');

        const select = event.target;
        seasonName = select.selectedOptions[0].text;
        seasonId = select.value;

        if (!seasonId) {
            urlParams.delete('season');
        } else {
            if (urlParams.has('season')) {
                urlParams.set('season', seasonId);
            } else {
                urlParams.append('season', seasonId);
            }
        }
        window.history.replaceState(null, null, "?" + urlParams);

        console.log('fetching...');
        fetchData();
    });
}

const fetchData = () => {
    fetch('/api/fetch.js', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: tournamentId,
            db: db,
            seasonId: seasonId
        })
      })
    .then((response) => response.json())
    .then((json) => {
        console.log('rendering page', json.data);
        if (json.data) {
            renderPage({
                data: json.data,
                view: view,
                playerId: playerId,
                seasonName: seasonName
            });
        } else {
          // if user navigates to another page immediately after fetchDate() is invoked
          // json is empty so we need to invoke fetchData() again
          fetchData();
        }
    }).catch(function(err) {
        console.error(` Err: ${err}`);
    });
}

fetchData();



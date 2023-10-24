import { renderPage, getHTML } from './lib/utils.js';

const urlParams = new URLSearchParams(window.location.search);
const seasonId = urlParams.get('season_id');
const tournamentId = urlParams.get('tournament_id');
const query = tournamentId ? `tournament_id=${tournamentId}` :
    seasonId ? `season_id=${seasonId}` : '';
const addNavigation = async (seasons) => {
    const navHTML = await getHTML('hbs/nav.hbs', {
        season_id: seasonId,
        seasons: seasons
    });
    const navElm = new DOMParser().parseFromString(navHTML, 'text/html').body.firstChild;
    navElm.addEventListener('change', (event) => {
        const season_id = event.target.value;
        if (season_id) {
            urlParams.set('season_id', season_id);
        } else {
            urlParams.delete('season_id');
        }
        window.location.search = urlParams;
    });
    document.querySelector('main').prepend(navElm);
};

const fetchData = () => {
    fetch(`/api/tournament?${query}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }/*,
        body: JSON.stringify({
            tournament_id: ,
            seasonId: seasonId
        })*/
      })
    .then((response) => response.json())
    .then(async (json) => {
        await addNavigation(json.seasons);
        if (json.error) {
            alert(json.message);
        }
        if (json.tournaments) {
            renderPage({
                data: json.tournaments,
                view: urlParams.get('view') || 'ranking',
                player_id:  urlParams.get('player_id'),
                season_id: seasonId
            });
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

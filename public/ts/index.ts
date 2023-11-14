import { renderPage, tournament, playerDB } from './lib/utils.js';
import { addNavigation, season} from './lib/nav.js';

interface data {
    tournaments: tournament[],
    seasons: season[],
    players: playerDB[],
    error?: string,
    message?: string
}
const urlParams = new URLSearchParams(window.location.search);
const seasonId: string | null = urlParams.get('season_id');
const tournamentId: string | null = urlParams.get('tournament_id');
const getQuery = (tournamentId, seasonId) => {
    if (tournamentId) {
        return `tournament_id=${tournamentId}`;
    } else if (seasonId) {
        return `season_id=${seasonId}`;
    } else {
        return '';
    }
}
const fetchData = () => {
    const query = getQuery(tournamentId, seasonId);
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
    .then(async (json: data) => {
        console.log(json);
        await addNavigation(json.seasons, seasonId, urlParams);
        if (json.error) {
            alert(json.message);
        }
        if (json.tournaments) {
            const seasonName = json.seasons.find(item =>
                item._id == seasonId)?.name || 'All-Time';
            renderPage({
                data: json.tournaments,
                players: json.players,
                view: urlParams.get('view') || 'ranking',
                player_id: urlParams.get('player_id'),
                season_id: seasonId,
                season_name: seasonName
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

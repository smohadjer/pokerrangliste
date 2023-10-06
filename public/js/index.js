import { renderPage, getHTML } from './lib/utils.js';

const urlParams = new URLSearchParams(window.location.search);
const seasonId = urlParams.get('season') || 'all-time';
const addNavigation = async (seasons) => {
    const navHTML = await getHTML('hbs/nav.hbs', {
        seasonId: seasonId,
        seasons: seasons
    });
    const navElm = new DOMParser().parseFromString(navHTML, 'text/html').body.firstChild;
    navElm.addEventListener('change', (event) => {
        const season = event.target.value;
        urlParams.set('season', season);
        window.location.search = urlParams;
    });
    document.querySelector('main').prepend(navElm);
};
const fetchData = () => {
    fetch('/api/fetch.js', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tournament_id: urlParams.get('id'),
            seasonId: seasonId
        })
      })
    .then((response) => response.json())
    .then(async (json) => {
        console.log('rendering page...', json);
        //const seasonName = seasonSelector.querySelector('select').options[seasonSelector.querySelector('select').selectedIndex].text;

        await addNavigation(json.seasons);

        if (json.tournaments) {
            renderPage({
                data: json.tournaments,
                view: urlParams.get('view') || 'ranking',
                playerId:  urlParams.get('playerId'),
                seasonId: seasonId
                //seasonName: seasonName
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

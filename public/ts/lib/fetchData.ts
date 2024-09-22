import { Data } from './types.js';
import { renderPage } from './renderPage.js';
import { store } from './store.js';

export default async function fetchData() {
    try {
        const response = await fetch('/api/tournament', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
        });
        const json: Data = await response.json();
        if (json.error) {
            throw(json.message);
        } else {
            const payload: {data: Data, season_id?: string} = {
                data: json
            };

            // if no season_id is set, set season to last season entered in database
            if (!store.getState().season_id) {
                const id = json.seasons[json.seasons.length - 1]._id;
                payload.season_id = id;
            }

            store.setState({
                payload,
                action: renderPage
            });
        }
    } catch (e) {
        console.error(` Error: ${e}`);
    }
}

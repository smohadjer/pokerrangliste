import { router } from '../lib/router.js';
import { store } from '../lib/store.js';
import { populateSelect } from '../lib/utils.js';

export const hydrateLeagues = async (container: HTMLElement, league_id?: string) => {
    const select: HTMLSelectElement = container.querySelector('#leagues_dropdown')!;
    const state = store.getState();
    const leagues = state.leagues;
    populateSelect(select, leagues);
    select.closest('form')?.classList.remove('loading');

    if (league_id) {
        select.value = league_id;
    }

    select.addEventListener('change', (event) => {
        // reset state by setting dataIsState to true so data for new event is fetched
        store.setState({
            ...state,
            rankings: {},
            dataIsStale: true
        });

        if (select.value) {
            select.closest('form')?.classList.add('loading');
            window.localStorage.setItem('league_id', select.value);
            if (event.target instanceof HTMLSelectElement) {
                router('/tournaments', `?league_id=${select.value}`, {type: 'click'});
            }
        } else {
            window.localStorage.removeItem('league_id');
            router('/', '', {type: 'click'});
        }
    });
}

import { router } from '../lib/router.js';
import { store } from '../lib/store.js';
import { populateSelect } from '../lib/utils.js';

export const hydrateEvents = async (container: HTMLElement, event_id?: string) => {
    const select: HTMLSelectElement = container.querySelector('#events_dropdown')!;
    const state = store.getState();
    const events = state.events;
    populateSelect(select, events);
    select.closest('form')?.classList.remove('loading');

    if (event_id) {
        select.value = event_id;
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
            window.localStorage.setItem('event_id', select.value);
            if (event.target instanceof HTMLSelectElement) {
                router('/tournaments', `?event_id=${select.value}`, {type: 'click'});
            }
        } else {
            window.localStorage.removeItem('event_id');
            router('/', '', {type: 'click'});
        }
    });
}

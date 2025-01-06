import { router } from '../lib/router.js';
import { store } from '../lib/store.js';
import { populateSelect } from '../lib/utils.js';
import { fetchEvents } from '../lib/utils.js';

export const hydrateEvents = async (container: HTMLElement) => {
    const select: HTMLSelectElement = container.querySelector('#events_dropdown')!;
    const state = store.getState();
    const events = state.events.length > 0 ? state.events : await fetchEvents();
    populateSelect(select, events);
    select.closest('form')?.classList.remove('loading');
    select.addEventListener('change', (event) => {
        store.setState({ dataIsStale: true });
        select.closest('form')?.classList.add('loading');
        if (event.target instanceof HTMLSelectElement) {
            router('/ranking', `?event_id=${select.value}`, {type: 'click'});
        }
    });
}
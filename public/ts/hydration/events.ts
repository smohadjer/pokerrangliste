import { router } from '../lib/router.js';
import { store } from '../lib/store.js';
import { populateSelect } from '../lib/utils.js';

export const hydrateEvents = async (container: HTMLElement) => {
    const select: HTMLSelectElement = container.querySelector('#events_dropdown')!;
    const state = store.getState();
    const events = state.events;
    populateSelect(select, events);
    select.closest('form')?.classList.remove('loading');
    select.addEventListener('change', (event) => {
        store.setState({
            ...state,
            dataIsStale: true
        });
        select.closest('form')?.classList.add('loading');
        if (event.target instanceof HTMLSelectElement) {
            router('/tournaments', `?event_id=${select.value}`, {type: 'click'});
        }
    });
}

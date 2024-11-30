import { State } from '../lib/types';
import { store } from '../lib/store.js';

export function initSeasonSelector(seasonDropdown: HTMLSelectElement) {
    const state: State = store.getState();
    console.log('initiating seasons dropdown...');
    seasonDropdown.closest('div')!.classList.add('loading');
    let seasonsOptions = '';
    state.seasons.forEach(item => {
        seasonsOptions += `<option value="${item._id}">${item.name}</option>`
    });
    seasonDropdown.innerHTML = seasonsOptions;
    seasonDropdown.closest('div')!.classList.remove('loading');
}

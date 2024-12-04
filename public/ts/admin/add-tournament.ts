import { State } from '../lib/types';
import { store } from '../lib/store.js';
import { initSeasonSelector } from './seasonSelector.js';
import { generatePlayerFields } from './utils.js';

export const initAdmin = async (container: HTMLElement) => {
    console.log('initializing admin');
    const state: State = store.getState();

    // populate season dropdown
    const seasonDropdown: HTMLSelectElement = container.querySelector('#season_dropdown')!;
    initSeasonSelector(seasonDropdown);

    generatePlayerFields(container, state);
}





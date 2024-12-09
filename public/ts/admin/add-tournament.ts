import { State } from '../lib/types';
import { store } from '../lib/store.js';
import {
    initTournamentForm
} from './utils.js';

export const initAddTournament = async (container: HTMLElement) => {
    const fieldset: HTMLElement = container.querySelector('#tournament-fieldset')!;
    const state: State = store.getState();

    initTournamentForm(fieldset, state);
}





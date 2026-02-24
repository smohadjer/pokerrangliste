import { State } from '../types';
import { store } from '../lib/store.js';
import { initTournamentForm } from './initTournamentForm.js';

export const initAddTournament = async (container: HTMLElement, default_season_id?: string) => {
    const fieldset: HTMLElement = container.querySelector('#tournament-fieldset')!;
    const state: State = store.getState();

    initTournamentForm(fieldset, state, null, default_season_id );
}





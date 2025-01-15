import { State } from '../types';
import { store } from '../lib/store.js';
import { populateSelectTournaments } from '../lib/utils.js';

export function initDuplicateTournament(container: HTMLElement) {
    const tournamentDropdown: HTMLSelectElement = container.querySelector('#tournament_duplicate_dropdown')!;
    const state: State = store.getState();

    // populates tournament select
    populateSelectTournaments(tournamentDropdown, state.tournaments);
}





import { State } from './lib/types';
import { store } from './lib/store.js';
import {
    populateSelectTournaments,
    initTournamentForm
} from './utils.js';
import { generateHTML } from './components/generateHTML.js';

export function initEditTournament(container: HTMLElement) {
    const tournamentDropdown: HTMLSelectElement = container.querySelector('#tournament_edit_dropdown')!;
    const fieldset: HTMLElement = container.querySelector('#tournament-fieldset')!;
    const state: State = store.getState();

    // populates tournament select
    populateSelectTournaments(tournamentDropdown, state.tournaments);

    tournamentDropdown.addEventListener('change', async (event) => {
        if (event.target instanceof HTMLSelectElement) {
            const tournamentId = event.target.value;
            const tournaments = state.tournaments.filter(
                item => item._id === tournamentId);
            const tournamentData = tournaments[0];
            const htmlElement = await generateHTML('/views/partials/tournamentForm.hbs', tournamentData);

            fieldset.innerHTML = '';
            fieldset.append(...htmlElement);

            initTournamentForm(fieldset, state, tournamentData);
        }
    });
}





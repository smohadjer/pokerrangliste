import { State } from '../types';
import { store } from '../lib/store.js';
import { populateSelectTournaments, generateHTML } from '../lib/utils.js';
import { initTournamentForm } from './initTournamentForm.js';

export function initEditTournament(container: HTMLElement) {
    const tournamentDropdown: HTMLSelectElement = container.querySelector('#tournament_edit_dropdown')!;
    const formWrapper: HTMLElement = container.querySelector('#tournament-fieldset')!;
    const state: State = store.getState();
    const renderForm = async (tournamentId: string) => {
        const tournaments = state.tournaments.filter(item => item._id === tournamentId);
        const tournamentData = tournaments[0];
        const htmlElement = await generateHTML('/views/partials/tournamentForm.hbs', tournamentData);

        formWrapper.innerHTML = '';
        formWrapper.append(...htmlElement);

        await initTournamentForm(formWrapper, state, tournamentData);
    };

    // if url has tournament id render edit form
    const url = new URL(window.location.href);
    const tournament_id = url.searchParams.get('tournament_id') ?? undefined;
    if (tournament_id) {
        renderForm(tournament_id);
    }

    // populates tournaments selection dropdown with optional argument tournament_id and set change handler for it
    populateSelectTournaments(tournamentDropdown, state.tournaments, tournament_id);
    tournamentDropdown.addEventListener('change', async (event) => {
        if (event.target instanceof HTMLSelectElement) {
            const tournamentId = event.target.value;
            renderForm(tournamentId);

            // add selected tournament id to url
            const url = new URL(window.location.href);
            url.searchParams.set('tournament_id', tournamentId);
            console.log(tournamentId)
            window.history.replaceState({}, '', url.toString());
        }
    });
}







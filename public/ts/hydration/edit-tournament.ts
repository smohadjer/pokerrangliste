import { State } from '../types';
import { store } from '../lib/store.js';
import {
    populateSelectTournaments,
    generateHTML,
    getRebuys,
    getPrize
} from '../lib/utils.js';
import { initTournamentForm } from './initTournamentForm.js';

export function initEditTournament(container: HTMLElement, tournament_id: string) {
    const tournamentDropdown: HTMLSelectElement = container.querySelector('#tournament_edit_dropdown')!;
    const formWrapper: HTMLElement = container.querySelector('#tournament-fieldset')!;
    const state: State = store.getState();
    const renderForm = async (tournamentId: string) => {
        const tournaments = state.tournaments.filter(item => item._id === tournamentId);
        const tournamentData = tournaments[0];
        const rebuys = getRebuys(tournamentData);
        const playersCount = tournamentData.players?.length ?? 0;
        const totalPrize = tournamentData.buyin * playersCount + rebuys *  tournamentData.buyin;
        const data = {...tournamentData, rebuys, totalPrize};
        const htmlElement = await generateHTML('/views/partials/tournamentForm.hbs', data);
        formWrapper.innerHTML = '';
        formWrapper.append(...htmlElement);

        await initTournamentForm(formWrapper, state, tournamentData);
    };

    // if tournament id is provided render edit form
    const url = new URL(window.location.href);
    const tournamentId = tournament_id ?? url.searchParams.get('tournament_id');
    if (tournamentId) {
        renderForm(tournamentId);
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







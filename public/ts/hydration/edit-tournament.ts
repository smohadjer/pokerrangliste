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
        const form: HTMLFormElement | null = container.querySelector('#post-tournament');
        if (form) {
            const formData = new FormData(form);
            const status = formData.get('status') ?? '';
            UpdateState(container, status as string);
        }
    };

    // if url has tournament id render edit form
    const url = new URL(window.location.href);
    const tournament_id = url.searchParams.get('tournament_id') ?? undefined;
    if (tournament_id) {
        renderForm(tournament_id);
    }

    // populates tournament select with optional argument tournament_id
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

    container.addEventListener('change', async (event) => {
        if (event.target instanceof HTMLInputElement &&
            event.target.getAttribute('name') === 'status') {
            UpdateState(container, event.target.value);
        }
    });
}

function UpdateState(container: HTMLElement, status: string) {
    const AddPlayerSelect = container.querySelector('#player_dropdown');
    const deletePlayerButtons = container.querySelectorAll('.button-delete');
    const playerRows = container.querySelectorAll('.row-player');
    const submitButton = container.querySelector('.submit button')!;

    if (status === 'upcoming') {
        AddPlayerSelect?.removeAttribute('disabled');
        deletePlayerButtons.forEach(btn => {
            btn.removeAttribute('disabled');
        });
        playerRows.forEach(row => row.classList.add('disabled'));
        submitButton.setAttribute('disabled', 'disabled');
    } else {
        AddPlayerSelect?.setAttribute('disabled', 'disabled');
        deletePlayerButtons.forEach(btn => {
            btn.setAttribute('disabled', 'disabled');
        });
        playerRows.forEach(row => row.classList.remove('disabled'));
        submitButton.removeAttribute('disabled');
    }
}





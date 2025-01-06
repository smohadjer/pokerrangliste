import { State } from '../lib/types';
import { store } from '../lib/store.js';
import { populateSelectTournaments, generateHTML } from '../lib/utils.js';
import { initTournamentForm } from './initTournamentForm.js';

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

            await initTournamentForm(fieldset, state, tournamentData);
            const form: HTMLFormElement | null = container.querySelector('#post-tournament');
            if (form) {
                const formData = new FormData(form);
                const status = formData.get('status') ?? '';
                toggleAddRemovePlayerControls(container, status as string);
            }
        }
    });

    container.addEventListener('change', async (event) => {
        if (event.target instanceof HTMLInputElement &&
            event.target.getAttribute('name') === 'status') {
            toggleAddRemovePlayerControls(container, event.target.value);
        }
    });
}

function toggleAddRemovePlayerControls(container: HTMLElement, status: string) {
    const AddPlayerSelect = container.querySelector('#player_dropdown');
    const deletePlayerButtons = container.querySelectorAll('.button-delete');

    if (status === 'upcoming') {
        AddPlayerSelect?.removeAttribute('disabled');
        deletePlayerButtons.forEach(btn => {
            btn.removeAttribute('disabled');
        })
    } else {
        AddPlayerSelect?.setAttribute('disabled', 'disabled');
        deletePlayerButtons.forEach(btn => {
            btn.setAttribute('disabled', 'disabled');
        })
    }
}





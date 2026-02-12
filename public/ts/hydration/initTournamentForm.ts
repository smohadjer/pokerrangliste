import { generatePlayerFields } from './generatePlayerFields';
import { State, Tournament } from '../types';
import { populateSelect } from '../lib/utils';

export async function initTournamentForm(
    formWrapper: HTMLElement,
    state: State,
    data?: Tournament) {
    // populate season dropdown
    const seasonDropdown: HTMLSelectElement = formWrapper.querySelector('#season_dropdown')!;
    populateSelect(seasonDropdown, state.seasons);
    if (data && data.season_id) {
        seasonDropdown.value = data.season_id;
    }

    // populate player dropdown
    const playerDropdown: HTMLSelectElement = formWrapper.querySelector('#player_dropdown')!;
    populateSelect(playerDropdown, state.players);

    await generatePlayerFields(formWrapper, playerDropdown, data);

    const form: HTMLFormElement | null = formWrapper.closest('form');
    if (form) {
        const formData = new FormData(form);
        const status = formData.get('status') ?? '';
        UpdateTournamentState(form, status as string);

        // change handler for tournament status field
        form.addEventListener('change', async (event) => {
            const form = formWrapper.closest('form');
            if (form && event.target instanceof HTMLInputElement &&
                event.target.getAttribute('name') === 'status') {
                UpdateTournamentState(form, event.target.value);
            }
        });
    }
}

function UpdateTournamentState(form: HTMLFormElement, status: string) {
    const AddPlayers = form.querySelector('.row--addPlayers');
    const deletePlayerButtons = form.querySelectorAll('.button-delete');
    const playerRows = form.querySelectorAll('.row-player');
    const resultsTable = form.querySelector('.table-players');

    if (status === 'done') {
        resultsTable?.querySelectorAll('input').forEach(inputField => {
            inputField.setAttribute('disabled', 'disabled');
        })
    } else {
        resultsTable?.querySelectorAll('input').forEach(inputField => {
            inputField.removeAttribute('disabled');
        })
    }

    if (status === 'upcoming') {
        AddPlayers?.classList.remove('disabled');
        deletePlayerButtons.forEach(btn => {
            btn.removeAttribute('disabled');
        });
        playerRows.forEach(row => row.classList.add('disabled'));
    } else {
        AddPlayers?.classList.add('disabled');
        deletePlayerButtons.forEach(btn => {
            btn.setAttribute('disabled', 'disabled');
        });
        playerRows.forEach(row => row.classList.remove('disabled'));
    }
}


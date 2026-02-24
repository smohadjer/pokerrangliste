import { generatePlayerFields } from './generatePlayerFields';
import { State, Tournament, PlayerDB, Player } from '../types';
import { populateSelect } from '../lib/utils';

export async function initTournamentForm(
    formWrapper: HTMLElement,
    state: State,
    data: Tournament | null,
    default_season_id?: string) {
    // populate season dropdown
    const seasonDropdown: HTMLSelectElement = formWrapper.querySelector('#season_dropdown')!;
    populateSelect(seasonDropdown, state.seasons);
    const seasonId = data ? data.season_id : default_season_id;
    if (seasonId) {
        seasonDropdown.value = seasonId
    }

    // populate player selection box
    const playerDropdown: HTMLElement = formWrapper.querySelector('#player_dropdown')!;
    populatePlayers(playerDropdown, state.players, data?.players);

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
    const resultsTable = form.querySelector('.table-players');

    // disable input fields if tournament is complete to avoid changing values by mistake
    if (status === 'done') {
        resultsTable?.querySelectorAll('input').forEach(inputField => {
            inputField.readOnly = true;
        })
    } else {
        resultsTable?.querySelectorAll('input').forEach(inputField => {
            inputField.readOnly = false;
        })
    }

    if (status === 'upcoming') {
        AddPlayers?.classList.remove('disabled');
    } else {
        AddPlayers?.classList.add('disabled');
    }
}

function populatePlayers(container: HTMLElement, allPlayers: PlayerDB[], tournamentPlayers: Player[] | undefined) {
    let markup = '';
    allPlayers.forEach(item => {
        // the input fields are only for frontend and shouldn't be submitted so we don't
        // set a name attribute on them
        const playerFound = tournamentPlayers?.find(player => player.id === item._id);
        markup += `<label><input type="checkbox" ${playerFound ? 'checked' : ''} value="${item._id}">${item.name}</label>`
    });
    container.innerHTML = markup;
}


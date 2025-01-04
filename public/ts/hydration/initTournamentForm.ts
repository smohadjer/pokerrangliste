import { generatePlayerFields } from './generatePlayerFields';
import { State, Tournament } from '../lib/types';
import { populateSelect } from '../lib/utils';

export async function initTournamentForm(
    form: HTMLElement,
    state: State,
    data?: Tournament) {
    // populate season dropdown
    const seasonDropdown: HTMLSelectElement = form.querySelector('#season_dropdown')!;
    populateSelect(seasonDropdown, state.seasons);
    if (data && data.season_id) {
        seasonDropdown.value = data.season_id;
    }

    // populate player dropdown
    const playerDropdown: HTMLSelectElement = form.querySelector('#player_dropdown')!;
    populateSelect(playerDropdown, state.players);

    await generatePlayerFields(form, playerDropdown, data);
}

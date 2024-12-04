import { State } from '../lib/types';
import { store } from '../lib/store.js';
import { getHandlebarsTemplate } from '../lib/setHandlebars.js';
import { initSeasonSelector } from './seasonSelector.js';
import { generatePlayerFields } from './utils.js';

export function initEditTournament(container: HTMLElement, view: string) {
    // populate dropdown
    const tournamentDropdown: HTMLSelectElement = container.querySelector('#tournament_edit_dropdown')!;
    const state: State = store.getState();

    initTournamentSelector(tournamentDropdown, state);

    tournamentDropdown.addEventListener('change', async (event) => {
        if (event.target instanceof HTMLSelectElement) {
            const tournamentId = event.target.value;
            const tournamentData = state.tournaments.filter(
                item => item._id === tournamentId);
            console.log(tournamentData);
            const templateFile = `/views/admin/tournament-form.hbs`;
            const template = await getHandlebarsTemplate(templateFile);
            const htmlString = template(tournamentData[0]);
            const htmlElement = new DOMParser().parseFromString(htmlString,
                'text/html').body.children;
            tournamentDropdown.after(...htmlElement);

            // populate season dropdown
            const seasonDropdown: HTMLSelectElement = container.querySelector('#season_dropdown')!;
            initSeasonSelector(seasonDropdown);
            seasonDropdown.value = tournamentData[0].season_id;

            generatePlayerFields(container, state, tournamentData[0]);
        }
    });
}

function initTournamentSelector(dropdown: HTMLSelectElement, state: State) {
    console.log('initiating dropdown');
    dropdown.closest('div')!.classList.add('loading');
    let options = '';
    console.log(state.tournaments);
    state.tournaments.forEach(item => {
        options += `<option value="${item._id}">${item.date} (${item.round})</option>`
    });
    dropdown.innerHTML = options;
    dropdown.closest('div')!.classList.remove('loading');
}

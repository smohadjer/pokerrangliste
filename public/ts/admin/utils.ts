/*** Only pure functions in this file! ***/
import { State, Tournament, Player } from '../lib/types';
import { getHandlebarsTemplate } from '../lib/setHandlebars.js';
import { getPlayerName } from '../lib/utils';

// used to populate players and seasons select
export function populateSelect(select: HTMLSelectElement, data: any[]) {
    let options = '';
    data.forEach(item => {
        options += `<option value="${item._id}">${item.name}</option>`
    });
    select.innerHTML = options;
}

export function populateSelectTournaments(select: HTMLSelectElement, data: any[]) {
    let options = '';
    data.forEach(item => {
        options += `<option value="${item._id}">${item.date} (${item.round})</option>`
    });
    select.innerHTML = options;
}

export async function generateHTML(templateFile: string, data: Tournament) {
    const template = await getHandlebarsTemplate(templateFile);
    const htmlString = template(data);
    const html = new DOMParser().parseFromString(htmlString,
        'text/html').body.children;
    return html;
}

export function initTournamentForm(
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

    generatePlayerFields(form, data);
}

export function generatePlayerFields(
    container: HTMLElement,
    data?: Tournament) {
    const addPlayerButton = container.querySelector('#add-player')!;
    const playersElm = container.querySelector('#players')!;
    const playerDropdown: HTMLSelectElement = container.querySelector('#player_dropdown')!;

    // const populatePlayerSelect = (htmlElement: HTMLCollection) => {
    //     Array.from(htmlElement).forEach(element => {
    //         const select = element.querySelector('select')!;
    //         populateSelect(select, state.players);
    //     });
    // };

    // click handler for player delete button
    playersElm.addEventListener('click', (event) => {
        if (event.target instanceof HTMLButtonElement &&
        event.target.classList.contains('button-delete')) {
            const row = event.target.closest('.row-player');
            row?.remove();
        }
    });

    const addPlayer = (htmlString: string) => {
       const htmlElement = new DOMParser().parseFromString(htmlString,
            'text/html').body.children;
        playersElm.append(...htmlElement);
    }

    if (addPlayerButton) {
        addPlayerButton.addEventListener('click', (event) => {
            if (event.target instanceof HTMLButtonElement) {
                const id = playerDropdown.value;
                const name = playerDropdown.options[playerDropdown.selectedIndex].text;
                const player: Player = {
                    id,
                    name,
                    ranking: 0,
                    rebuys: 0,
                    prize: 0
                };
                const htmlString = getPlayersList(player);
                addPlayer(htmlString);
            }
        });
    }

    if (data) {
        for (let i = 0; i<data.players.length; i++) {
            const playerName = getPlayerName(data.players[i].id);
            data.players[i].name = playerName;
            const htmlString = getPlayersList(data.players[i]);
            addPlayer(htmlString);
        }
    }
}

function getPlayersList(player: Player) {
    let html = `<div class="row-player">
        <div class="row">
            <label><strong>${player.name}</strong></label>
            <input hidden name="players" value="${player.id}"
        </div>`;

    html +=
        `<div class="row">
            <label class="label">Ranking:</label>
            <input name="player_${player.id}_ranking" value="${player.ranking}" type="number" min="0">
        </div>`;

    html +=
        `<div class="row">
            <label class="label">Rebuys:</label>
            <input name="player_${player.id}_rebuys" value="${player.rebuys}" type="number" min="0">
        </div>`;

    html +=
        `<div class="row">
            <label class="label">Prize:</label>
            <input name="player_${player.id}_prize" value="${player.prize}" type="number" min="0">
        </div>
        <div class="row">
            <label></label>
            <button class="button-delete" type="button">Remove</button>
        </div>
    </div>`;

    return html;
}

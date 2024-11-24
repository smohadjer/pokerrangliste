import { State } from './types';
import { store } from './store.js';

export const initAdmin = async (container: HTMLElement) => {
    console.log('initializing admin');
    const countElm = container.querySelector('input[name=count]');
    const playersElm = container.querySelector('#players');
    const state: State = store.getState();

    initSeasonSelector(container, state);

    let playersSelect = '';
    state.players.forEach(item => {
        playersSelect += `<option value="${item._id}">${item.name}</option>`
    });
    populateSelectPlayer('#player_edit_dropdown', playersSelect);
    //populateSelectPlayer('#player_delete_dropdown', playersSelect);

    if (countElm) {
        countElm.addEventListener('change', (event) => {
            if (!playersElm) return;
            if (event.target instanceof HTMLInputElement) {
                const count = Number(event.target.value);
                playersElm.innerHTML = getPlayersList(count, playersSelect);
            }
        });
    };
}

function getPlayersList(count: number, playersSelect: string) {
    let html = '';
    for (let i = 0; i<count; i++) {
        html += `<div>
        <label>Player #${i+1} *</label>
        <select required name="players_${i}_id" >
            <option value="">Select player</option>
            ${playersSelect}
        </select><br>

        <label class="label">Rebuys:</label>
        <input required name="players_${i}_rebuys" value="0"><br>

        <label class="label">Prize:</label>
        <input required name="players_${i}_prize" value="0">
        </div>`;
    }
    return html;
}

function populateSelectPlayer(selector: string, players: string) {
    const select = document.querySelector(selector);
    select?.parentElement?.classList.remove('loading');
    const myHtmlElement = new DOMParser().parseFromString(players,
        'text/html').body.children;
    if (select) {
        select.append(...myHtmlElement);
    }
}

function initSeasonSelector(container: HTMLElement, state: State) {
    console.log('initiating seasons dropdown...');
    const seasonDropdown: HTMLSelectElement = container.querySelector('#season_dropdown')!;
    seasonDropdown.closest('div')!.classList.add('loading');
    let seasonsOptions = '';
    state.seasons.forEach(item => {
        seasonsOptions += `<option value="${item._id}">${item.name}</option>`
    });
    seasonDropdown.innerHTML = seasonsOptions;
    seasonDropdown.closest('div')!.classList.remove('loading');
}

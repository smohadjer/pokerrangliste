import { State } from '../lib/types';
import { store } from '../lib/store.js';
import { initSeasonSelector } from './seasonSelector.js';

export const initAdmin = async (container: HTMLElement) => {
    console.log('initializing admin');
    const countElm = container.querySelector('input[name=count]');
    const playersElm = container.querySelector('#players');
    const state: State = store.getState();

    // populate season dropdown
    const seasonDropdown: HTMLSelectElement = container.querySelector('#season_dropdown')!;
    initSeasonSelector(seasonDropdown);

    let playersSelect = '';
    state.players.forEach(item => {
        playersSelect += `<option value="${item._id}">${item.name}</option>`
    });

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

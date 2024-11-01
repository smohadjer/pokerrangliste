import { Season, State } from './types';
import { store } from './store.js';

export const initAdmin = async (container: HTMLElement) => {
    const seasonDropdown: HTMLSelectElement = container.querySelector('#season_dropdown')!;
    const countElm = container.querySelector('input[name=count]');
    const playersElm = container.querySelector('#players');
    const postTournamentForm = container.querySelector('#post-tournament')!;
    const state: State = store.getState();

    console.log('initiating seasons dropdown...', seasonDropdown);
    seasonDropdown.closest('div')!.classList.add('loading');
    let seasonsOptions = '';
    state.seasons.forEach(item => {
        seasonsOptions += `<option value="${item._id}">${item.name}</option>`
    });
    seasonDropdown.innerHTML = seasonsOptions;
    seasonDropdown.closest('div')!.classList.remove('loading');

    let playersSelect = '';

    state.players.forEach(item => {
        playersSelect += `<option value="${item._id}">${item.name}</option>`
    });

    initEditPlayer('#player_edit_dropdown', playersSelect);

    if (countElm) {
        countElm.addEventListener('change', (event) => {
            if (!playersElm) return;
            if (event.target instanceof HTMLInputElement) {
                const count = Number(event.target.value);
                playersElm.innerHTML = getPlayersList(count, playersSelect);
            }
        });

        if (postTournamentForm) {
            postTournamentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = new FormData(form);
                fetch(form.action, {
                    method: form.getAttribute('method') || 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(Object.fromEntries(data))
                })
                .then((response) => response.json())
                .then(async (json) => {
                    console.log(json);
                    if (json.error) {
                        alert(json.error + ' ' + json.message);
                    } else {
                        form.reset();
                        playersElm!.innerHTML = '';
                        alert(`Tournament with id ${json.tournament_id} was posted successfully.`);
                    }
                }).catch(function(err) {
                    console.log(err);
                    alert(err);
                });
            });
        }
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

function initEditPlayer(selector: string, players: string) {
    const select = document.querySelector(selector);
    select?.parentElement?.classList.remove('loading');
    const myHtmlElement = new DOMParser().parseFromString(players,
        'text/html').body.children;
    if (select) {
        select.append(...myHtmlElement);
    }
}

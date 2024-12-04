import { State, Tournament } from '../lib/types';

export function generatePlayerFields(container: HTMLElement, state: State, data?: Tournament) {
    const countElm: HTMLSelectElement = container.querySelector('[name=count]')!;
    const playersElm = container.querySelector('#players');
    if (countElm) {
        countElm.addEventListener('change', (event) => {
            console.log(event)
            if (!playersElm) return;
            if (event.target instanceof HTMLSelectElement) {
                const count = Number(event.target.value);
                const htmlString = getPlayersList(count, state);
                const htmlElement = new DOMParser().parseFromString(htmlString,
                    'text/html').body.children;
                playersElm.innerHTML = '';
                playersElm.append(...htmlElement);
            }
        });
    }

    if (data) {
        const count = data.players.length;
        countElm.value = count.toString();
        const htmlString = getPlayersList(count, state, data);
        const htmlElement = new DOMParser().parseFromString(htmlString,
            'text/html').body.children;
        playersElm!.innerHTML = '';
        playersElm!.append(...htmlElement);
    }
}

function getPlayersList(count: number, state: State, data?: Tournament) {
    let html = '';
    for (let i = 0; i<count; i++) {
        html += ` <div class="row">
        <label>Player *</label>
        <select required name="players_${i}_id" >
            <option value="">Select player</option>`;

            state.players.forEach(item => {
                if (data) {
                    html += `<option`;
                    if (data.players[i].id === item._id) {
                        html += ' selected ';
                    }
                    html += `value="${item._id}">${item.name}</option>`;
                } else {
                    html += `<option value="${item._id}">${item.name}</option>`;
                }
            });

        html += `</select><br>
            <label class="label">Ranking:</label>
            <input name="players_${i}_ranking" value="1" type="number" min="1" max="${count}"><br>

            <label class="label">Rebuys:</label>
            <input name="players_${i}_rebuys" value="0" type="number" min="0"><br>

            <label class="label">Prize:</label>
            <input name="players_${i}_prize" value="0" type="number" min="0">
        </div>`;
    }
    return html;
}

import { PlayerDB, Season } from './lib/definitions';

const countElm = document.querySelector('input[name=count]');
const playersElm = document.querySelector('#players');
const seasonDropdown = document.querySelector('#season_dropdown');
const postTournamentForm = document.getElementById('post-tournament')!;

let playersSelect = '';
const getPlayers = async () => {
    const response = await fetch('api/players');
    const players: Array<PlayerDB> = await response.json();
    players.forEach(element => {
        playersSelect += `<option value="${element._id}">${element.name}</option>`
    });
};
getPlayers();

if (seasonDropdown) {
    let seasonsOptions = '';
    const getSeasons = async () => {
        const response = await fetch('api/seasons');
        const seasons: Array<Season> = await response.json();
        seasons.forEach(element => {
            seasonsOptions += `<option value="${element._id}">${element.name}</option>`
        });
        console.log(seasonsOptions);
        seasonDropdown.innerHTML = seasonsOptions;
    };
    getSeasons();
}

const getPlayersList = (count) => {
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
};

if (countElm) {
    countElm.addEventListener('change', (event) => {
        if (!playersElm) return;
        if (event.target instanceof HTMLInputElement) {
            const count = Number(event.target.value);
            playersElm.innerHTML = getPlayersList(count);
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
                    alert(`Tournament with id ${json.tournament_id} was posted successfully.`);
                }
            }).catch(function(err) {
                console.log(err);
                alert(err);
            });
        });
    }
};

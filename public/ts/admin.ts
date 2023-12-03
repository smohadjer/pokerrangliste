import { PlayerDB } from './lib/definitions';

const countElm = document.querySelector('input[name=count]');
const playersElm = document.querySelector('#players');
const loginForm = document.getElementById('login');
const postTournamentForm = document.getElementById('post-tournament')!;

let accessToken = localStorage.getItem('accessToken');
const accessTokenIsValid = true;

if (accessToken && accessTokenIsValid) {
    loginForm?.setAttribute('hidden', 'hidden');
    postTournamentForm.removeAttribute('hidden');
}

let playersSelect = '';
const getPlayers = async() => {
    const response = await fetch('api/players');
    const players: Array<PlayerDB> = await response.json();
    players.forEach(element => {
        playersSelect += `<option value="${element._id}">${element.name}</option>`
    });
}

getPlayers();

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
                headers: {
                    'Authorization': 'Bearer ' +  accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(data))
            })
            .then((response) => response.json())
            .then(async (json) => {
                console.log(json);
                if (json.error) {
                    alert(json.error + ' ' + json.message);
                    localStorage.removeItem('accessToken');
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

    // submit handler for login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = new FormData(form);
            fetch(form.action, {
                method: form.getAttribute('method') || 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(data))
            })
            .then((response) => response.json())
            .then(async (json) => {
                console.log(json);
                accessToken = json.access_token;
                if (accessToken) {
                    localStorage.setItem('accessToken', accessToken);
                }

                if (postTournamentForm) {
                    postTournamentForm.removeAttribute('hidden');
                }
                loginForm.setAttribute('hidden', 'hidden');
                console.log('Access to API granted for 1 hour. Your access token is: ', accessToken);
                form.reset();
            }).catch(function(err) {
                console.error(` Err: ${err}`);
                accessToken = null;
                alert('Wrong credentials. Try again');
            });
        });
    }
};

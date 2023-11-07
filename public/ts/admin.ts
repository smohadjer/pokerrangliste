const countElm = document.querySelector('input[name=count]');
const playersElm = document.querySelector('#players');
let accessToken;

const getPlayersList = (count) => {
    let html = '';
    for (let i = 0; i<count; i++) {
        html += `<div>
        <label>Player #${i+1} *</label>
        <input required list="players-list" name="players_${i}_name" placeholder="Name"><br>
        <datalist id="players-list">
            <option value="Andreas D.">
            <option value="Andreas L.">
            <option value="Konstantin">
            <option value="Goscha">
            <option value="Michael">
            <option value="Silvia">
            <option value="Eva">
            <option value="Vika">
            <option value="Isabela">
            <option value="Mehdi">
            <option value="Masoud">
            <option value="Saeid">
            <option value="Tara">
            <option value="Simon">
            <option value="Anca">
            <option value="Nikolai">
            <option value="Sebastian">
        </datalist>
        <label class="label">Rebuys:</label>
        <select required name="players_${i}_rebuys">
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
        </select><br>
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

    const postTournamentForm = document.getElementById('post-tournament');
    if (postTournamentForm) {
        postTournamentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = new FormData(form);
            console.log(accessToken);
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
    const loginForm = document.getElementById('login');
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
                accessToken = json.access_token;
                if (postTournamentForm) {
                    postTournamentForm.removeAttribute('hidden');
                }
                loginForm.setAttribute('hidden', 'hidden');
                console.log('Access to API granted for 1 hour. Your access token is: ', accessToken);
                form.reset();
            }).catch(function(err) {
                console.error(` Err: ${err}`);
                accessToken = undefined;
                alert('Wrong credentials. Try again');
            });
        });
    }
};

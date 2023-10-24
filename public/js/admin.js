const countElm = document.querySelector('input[name=count]');
const playersElm = document.querySelector('#players');
let accessToken;
countElm.addEventListener('change', (event) => {
    const count = event.target.value;
    playersElm.innerHTML = '';
    var html = '';
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
    playersElm.innerHTML = html;
});

const postTournamentForm = document.getElementById('post-tournament');
const loginForm = document.getElementById('login');
const apiStatusElm = document.getElementById('api-status');

postTournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    console.log(accessToken);
    fetch(e.target.action, {
        method: e.target.getAttribute('method'),
        headers: {
            'Authorization': 'Bearer ' +  accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data))
    })
    .then((response) => response.json())
    .then(async (json) => {
        console.log(json);
        e.target.reset();
        apiStatusElm.innerHTML = JSON.stringify(json);
    }).catch(function(err) {
        console.log(err);
        alert(err);
    });
});

// submit handler for login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    fetch(e.target.action, {
        method: e.target.getAttribute('method'),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data))
    })
    .then((response) => response.json())
    .then(async (json) => {
        accessToken = json.access_token;
        postTournamentForm.removeAttribute('hidden');
        loginForm.setAttribute('hidden', 'hidden');
        console.log('Access to API granted for 1 hour');
        e.target.reset();
    }).catch(function(err) {
        console.error(` Err: ${err}`);
        accessToken = undefined;
        alert('Wrong credentials. Try again');
    });
});

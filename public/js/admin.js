const countElm = document.querySelector('input[name=count]');
const playersElm = document.querySelector('#players');
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

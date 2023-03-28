fetch('/api/fetch.js')
.then((response) => response.json())
.then((json) => {
    const data = json.data;
    if (data.length > 0) {
        let html = '';
        let count = 0;
        html += '<table><tr><th>Platz</th><th>Spieler</th><th>Spielzahl</th><th>Siege</th></tr>';
        data.forEach((item) => {
            count += 1;
            html += `<tr><td>${count}</td><td>${item.Name}</td><td>${item.Spiele}</td><td>${item.Siege}</td></tr>`
        });
        html += '</table>';
        const results = document.getElementById('results');
        if (results) {
            results.innerHTML = html;
        }
    }
});

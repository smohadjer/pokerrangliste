const getPoints = (item) => {
    const points = 0;

    return points;
};

fetch('/api/fetch.js')
.then((response) => response.json())
.then((json) => {
    const data = json.data;
    console.log(data);
    console.log(data.length);
    if (data) {
        let html = `<p>Date: ${data.date}<br>
        Buyin: ${data.buyin}&euro;`;

        if (data.prizes.length > 0) {
            html += `<br>`;
            data.prizes.forEach((item, index) => {
                html += `Prize ${index+1}: ${item}&euro;<br>`
            });
        }

        html += '</p>';


        let count = 0;
        html += '<table><tr><th>Ranking</th><th>Player</th><th>Rebuys</th><th>Points</th></tr>';
        data.players.forEach((item) => {
            count += 1;
            html += `<tr><td>${item.ranking}</td><td>${item.name}</td><td>${item.rebuys}</td>
            <td>${getPoints(item)}</td></tr>`
        });
        html += '</table>';
        console.log(html);
        const results = document.getElementById('results');
        if (results) {
            results.innerHTML = html;
        }
    }
});

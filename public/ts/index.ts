const getPoints = (item, data) => {
    const rebuys = item.rebuys * data.buyin;
    let points = 0 - data.buyin - rebuys;

    const winnersCount = data.prizes.length;
    if (item.ranking <= winnersCount) {
        points += data.prizes[item.ranking - 1];
    }

    if (data.bounties) {
        data.bounties.forEach((bounty)=> {
            if (item.name === bounty.name) {
                points += bounty.prize;
            }
        });
    }

    return points;
};

const getRebuys = (data) => {
    let rebuys = 0;
    data.players.forEach((player) => {
        rebuys += player.rebuys;
    });

    return rebuys;
};

const getPrize = (item, data) => {
    let prize = 0;
    const winnersCount = data.prizes.length;
    if (item.ranking <= winnersCount) {
        prize = data.prizes[item.ranking - 1];
    }

    return prize;
};

const getBounty = (item, data) => {
    let bounty = 0;
    if (!data.bounties || data.bounties.length === 0) {
        return bounty;
    } else {
        data.bounties.forEach((bountyObject)=> {
            if (item.name === bountyObject.name) {
                bounty = bountyObject.prize;
            }
        });
    }

    return bounty;
};

fetch('/api/fetch.js')
.then((response) => response.json())
.then((json) => {
    const data = json.data;
    console.log(data);
    console.log(data.length);
    if (data) {
        let html = `<p>Date: ${data.date}<br>
        Buyin: ${data.buyin}&euro;<br>
        Players: ${data.players.length}`;


        if (data.prizes.length > 0) {
            html += `<br>`;
            data.prizes.forEach((item, index) => {
                html += `Prize ${index+1}: ${item}&euro;<br>`
            });
        }

        html += `Total Rebuys: ${getRebuys(data)}`;


        html += '</p>';


        let count = 0;
        html += `<table><tr>
                <th>Ranking</th>
                <th>Player</th>
                <th>Rebuys</th>
                <th>Prize</th>
                <th>Bounty</th>
                <th>Points</th>
            </tr>`;
        data.players.forEach((item) => {
            count += 1;
            html += `<tr>
            <td>${item.ranking}</td>
            <td class="name">${item.name}</td>
            <td>${item.rebuys}</td>
            <td>${getPrize(item, data)}</td>
            <td>${getBounty(item, data)}</td>
            <td>${getPoints(item, data)}</td>
            </tr>`
        });
        html += '</table>';
        const results = document.getElementById('results');
        if (results) {
            results.innerHTML = html;
        }
    }
});

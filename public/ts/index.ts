const players = [];
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
    if (data) {

        data.players.forEach((item) => {
            item.points = getPoints(item, data);
            item.bounty = getBounty(item, data);
            item.prize = getPrize(item, data);
            players.push(item);
        });

        // sort based on points
        players.sort((item1, item2) => {
            return item2.points - item1.points;
        });

        // if points are the same, sort based on position
        players.sort((item1, item2) => {
            if (item1.points === item2.points) {
                return item1.ranking - item2.ranking;
            }
        });

        let html = `<p>Date: ${data.date}<br>
        Buyin: ${data.buyin} &euro;<br>
        Players: ${data.players.length}<br>`;

        let pot = 0;
        data.prizes.forEach((item) => {
            pot += item;
        });
        data.bounties.forEach((item) => {
            pot += item.prize;
        });

        html += `Prize: ${pot} &euro;<br>`

        html += `Rebuys: ${getRebuys(data)}`;


        html += '</p>';


        html += `<div class="wrapper"><table><tr>
                <th></th>
                <th>Player</th>
                <th>Position</th>
                <th>Rebuys</th>
                <th>Prize</th>
                <th>Bounty</th>
                <th>Points</th>
            </tr>`;

        let count = 0;
        players.forEach((item) => {
            count ++;
            html += `<tr>
            <td>${count}</td>
            <td class="name">${item.name}</td>
            <td>${item.ranking}</td>
            <td>${item.rebuys}</td>
            <td>${item.prize}</td>
            <td>${item.bounty}</td>
            <td>${item.points}</td>
            </tr>`
        });
        html += '</table></div>';
        const results = document.getElementById('results');
        if (results) {
            results.innerHTML = html;
        }
    }
});

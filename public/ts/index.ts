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
const addPlayers = (tournament) => {
    tournament.players.forEach((item) => {
        const clone = {...item};
        clone.points = getPoints(clone, tournament);
        clone.bounty = getBounty(clone, tournament);
        clone.prize = getPrize(clone, tournament);
        clone.games = 1;

        const foundPlayer = players.find((player) => player.name === clone.name);
        console.log(foundPlayer);

        if (foundPlayer) {
            console.log('found');
            foundPlayer.points += clone.points;
            foundPlayer.bounty += clone.bounty;
            foundPlayer.prize += clone.prize;
            foundPlayer.rebuys += clone.rebuys;
            foundPlayer.games += clone.games;
        } else {
            players.push(clone);
        }
    });
};
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const id = urlParams.get('id');
const renderPlayers = (players) => {
    let html = `<h1>Ranking 2023</h1>
    <p>Players are ranked by earnings. Last updated: June 3, 2023</p>
    <div class="wrapper"><table><tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Earnings</th>
            <th>Games</th>
            <th>Rebuys</th>
            <th>Prize</th>
            <th>Bounty</th>
        </tr>`;

    let count = 0;
    players.forEach((item) => {
        count ++;
        html += `<tr>
        <td>${count}</td>
        <td class="name">${item.name}</td>
        <td>${item.points}&nbsp;&euro;</td>
        <td>${item.games}</td>
        <td>${item.rebuys}</td>
        <td>${item.prize > 0 ? item.prize + '&nbsp;&euro;' : 0}</td>
        <td>${item.bounty > 0 ? item.bounty + '&nbsp;&euro;' : 0}</td>
        </tr>`
    });
    html += '</table></div>';
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = html;
    }
};
const renderTournament = (data) => {
    addPlayers(data);

    // sort based on points
    /*
    players.sort((item1, item2) => {
        return item2.points - item1.points;
    });
    */

    // if points are the same, sort based on position
    players.sort((item1, item2) => {
        return item1.ranking - item2.ranking;
    });

    let html = `<p>Date: ${data.date}<br>
    Buyin: ${data.buyin} &euro;<br>
    Players: ${data.players.length}<br>
    Rebuys: ${getRebuys(data)}<br>`;

    let pot = 0;
    data.prizes.forEach((item) => {
        pot += item;
    });
    data.bounties.forEach((item) => {
        pot += item.prize;
    });

    html += `Prize: ${pot} &euro;<br>`



    html += '</p>';


    html += `<div class="wrapper"><table><tr>
            <th></th>
            <th>Player</th>
            <th>Rebuys</th>
            <th>Prize</th>
            <th>Bounty</th>
            <th>Points</th>
        </tr>`;

    players.forEach((item) => {
        html += `<tr>
        <td>${item.ranking}</td>
        <td class="name">${item.name}</td>
        <td>${item.rebuys}</td>
        <td>${item.prize > 0 ? item.prize + '&nbsp;&euro;' : 0}</td>
        <td>${item.bounty > 0 ? item.bounty + '&nbsp;&euro;' : 0}</td>
        <td>${item.points}</td>
        </tr>`
    });
    html += '</table></div>';
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = html;
    }
};
const renderRanking = (data) => {
    data.forEach((tournament) => {
        console.log(tournament);
        addPlayers(tournament);
    });

    // sort based on points
    players.sort((item1, item2) => {
        return item2.points - item1.points;
    });

    renderPlayers(players);
};

fetch('/api/fetch.js', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({id: id})
  })
.then((response) => response.json())
.then((json) => {
    const data = json.data;
    if (data.length) {
        renderRanking(data);
    } else {
        renderTournament(data);
    }
});

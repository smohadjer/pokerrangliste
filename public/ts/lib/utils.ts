const players = [];
const getPoints = (player, tournament) => {
    const rebuys = player.rebuys * tournament.buyin;
    let points = 0 - tournament.buyin - rebuys;

    const winnersCount = tournament.prizes.length;
    if (player.ranking <= winnersCount) {
        points += tournament.prizes[player.ranking - 1];
    }

    if (tournament.bounties) {
      tournament.bounties.forEach((bounty)=> {
            if (player.name === bounty.name) {
                points += bounty.prize;
            }
        });
    }

    return points;
};
const getRebuys = (tournament) => {
    let rebuys = 0;
    tournament.players.forEach((player) => {
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

        if (foundPlayer) {
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

const renderPlayers = (players) => {
    let html = `<h1>All-time Ranking</h1>
    <div class="wrapper"><table><tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Points</th>
            <th>Tournaments</th>
            <th>Rebuys</th>
        </tr>`;

    let count = 0;
    players.forEach((item) => {
        count ++;
        html += `<tr>
        <td>${count}</td>
        <td class="name"><a href="/?playerId=${item.name}">${item.name}</a></td>
        <td>${item.points}</td>
        <td>${item.games}</td>
        <td>${item.rebuys}</td>
        </tr>`
    });
    html += '</table></div>';
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = html;
    }
};

export const renderTournament = (data) => {
    // if points are the same, sort based on position
    data.players.sort((item1, item2) => {
        return item1.ranking - item2.ranking;
    });

    let html = `<p><a href="#" onclick="history.go(-1); event.preventDefault();">Back</a></p>
    <h1>Tournament ${data.date}</h1>
    <p>Players: ${data.players.length} &nbsp; Buyin: ${data.buyin} &nbsp; Rebuys: ${getRebuys(data)}</p>`;

    let pot = 0;
    data.prizes.forEach((item) => {
        pot += item;
    });

    if ( data.bounties) {
        data.bounties.forEach((item) => {
            pot += item.prize;
        });
    }

    html += `<div class="wrapper"><table><tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Rebuys</th>
            <th>Prize</th>
            <th>Bounty</th>
            <th>Points</th>
        </tr>`;

    data.players.forEach((item) => {
        html += `<tr>
        <td>${item.ranking}</td>
        <td class="name"><a href="/?playerId=${item.name}">${item.name}</a></td>
        <td>${item.rebuys}</td>
        <td>${getPrize(item, data)}</td>
        <td>${getBounty(item, data)}</td>
        <td>${getPoints(item, data)}</td>
        </tr>`
    });
    html += '</table></div>';
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = html;
    }
};

const setPlayers = (data) => {
  if (players.length === 0) {
    data.forEach((tournament) => {
      addPlayers(tournament);
    });

    // sort players based on points
    players.sort((item1, item2) => {
      return item2.points - item1.points;
    });
  }
};

export const renderRanking = (data) => {
  setPlayers(data);
  renderPlayers(players);
};

const sortByDate = (data) => {
    const sortedData = structuredClone(data);
    // sort tournaments by date
    sortedData.sort((item1, item2) => {
      const date1 = new Date(item1.date).valueOf();
      const date2 = new Date(item2.date).valueOf();
      return date2 - date1;
    });

    return sortedData;
};

export const renderProfile = (data, playerId) => {
  setPlayers(data);

  const player = players.find((player) => player.name === playerId);
  const index = players.findIndex((player) => player.name === playerId);

  let html = `<p><a href="#" onclick="history.go(-1); event.preventDefault();">Back</a></p>
  <h1>${playerId}</h1>
  <p>Total Points: ${player.points} &nbsp; All-time Ranking: ${index + 1}</p>
  <div class="wrapper"><table><tr>
          <th>Tournament</th>
          <th>Points</th>
          <th>Rank</th>
          <th>Players</th>
          <th>Rebuys</th>
      </tr>`;

  const sortedData = sortByDate(data);

  sortedData.forEach((tournament) => {
      console.log(tournament);
      const player = tournament.players.filter(player => player.name === playerId);
      if (player.length > 0) {
        html += `<tr>
        <td><a href="/?id=${tournament._id}">${tournament.date}</a></td>
        <td>${getPoints(player[0], tournament)}</td>
        <td>${player[0].ranking}</td>
        <td>${tournament.players.length}</td>
        <td>${player[0].rebuys}</td>
        </tr>`
      }
  });

  html += '</table></div>';
  const results = document.getElementById('results');
  if (results) {
      results.innerHTML = html;
  }
};

export const renderGamesList = (data) => {
    let html = `<h1>Tournaments</h1>
    <div class="wrapper"><table><tr>
            <th>Date</th>
            <th>Players</th>
            <th>Buyin</th>
            <th>Rebuys</th>
            <th>Bounty</th>
        </tr>`;

  const sortedData = sortByDate(data);

  sortedData.forEach((tournament) => {
        html += `<tr>
        <td><a href="/?id=${tournament._id}">${tournament.date}</a></td>
        <td>${tournament.players.length}</td>
        <td>${tournament.buyin}</td>
        <td>${getRebuys(tournament)}</td>
        <td>${tournament.bounties ? 'Yes' : 'No'}</td>
        </tr>`;
  });

  html += '</table></div>';
  const results = document.getElementById('results');
  if (results) {
      results.innerHTML = html;
  }
};

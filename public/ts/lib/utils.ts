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
    let html = `<h1>Ranking 2023</h1>
    <div class="wrapper"><table><tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Points</th>
            <th>Games</th>
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

    let html = `<p><a href="/">Home</a></p>
    <h1>Tournament ${data.date}</h1>
    <p>Buyin: ${data.buyin} &nbsp; Players: ${data.players.length} &nbsp; Rebuys: ${getRebuys(data)}</p>`;

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
        <td class="name"><a href="/?playerId=${item.name}">${item.name}</a></td>
        <td>${item.rebuys}</td>
        <td>${item.prize > 0 ? item.prize : 0}</td>
        <td>${item.bounty > 0 ? item.bounty : 0}</td>
        <td>${item.points}</td>
        </tr>`
    });
    html += '</table></div>';
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = html;
    }
};

export const renderRanking = (data) => {
    data.forEach((tournament) => {
        addPlayers(tournament);
    });

    // sort based on points
    players.sort((item1, item2) => {
        return item2.points - item1.points;
    });

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
  console.log(playerId);

  let html = `<p><a href="/">Home</a></p>
  <h1>${playerId}</h1>
  <div class="wrapper"><table><tr>
          <th>Games</th>
          <th>Points</th>
          <th>Ranking</th>
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
  const heading = document.createElement('h2');
  heading.append('Games');

  const ul = document.createElement('ul');
  ul.setAttribute('class', 'listing');

  const sortedData = sortByDate(data);

  sortedData.forEach((tournament) => {
      const li = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.setAttribute('href', `/?id=${tournament._id}`);
      anchor.append(tournament.date);
      li.append(anchor);
      ul.append(li);
  });

  const results = document.getElementById('results');
  if (results) {
      results.append(heading);
      results.append(ul);
  }
};

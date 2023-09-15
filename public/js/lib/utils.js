// inc helper is used in hbs/ranking.hbs
Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});

const players = [];
const getPoints = (player, tournament) => {
    const rebuys = player.rebuys * tournament.buyin;
    const prize = getPrize(player, tournament);
    const bounty = getBounty(player, tournament);
    const points = prize + bounty - tournament.buyin - rebuys;
    return points;
};

const getRebuys = (tournament) => {
    let rebuys = 0;
    tournament.players.forEach((player) => {
        rebuys += player.rebuys;
    });

    return rebuys;
};

const getPrize = (player, tournament) => {
    const prize = (player.ranking <= tournament.prizes.length)
    ? tournament.prizes[player.ranking - 1] : 0;
    return prize;
};

const getBounty = (player, tournament) => {
    if (!tournament.bounties) {
        return 0;
    }
    const bountyWinner = tournament.bounties.find((item) => item.name === player.name);
    return bountyWinner ? bountyWinner.prize : 0;
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

const render = (templateFile, data) => {
    const resultsElement = document.getElementById('results');
    fetch(templateFile).then((res) => res.text()).then((text) => {
        const template = Handlebars.compile(text);
        const html = template(data);
        resultsElement.innerHTML = html;
        resultsElement.classList.remove('empty');

    });
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

export const renderPage = (options) => {
    const data = options.data;
    const view = options.view;
    const playerId = options.playerId;
    const seasonName = options.seasonName;

    if (view === 'ranking') {
        players.length = 0;
        setPlayers(data);

        render('hbs/ranking.hbs', {
            seasonName: seasonName,
            players: players
        });
    }

    if (view === 'tournament') {
        // if points are the same, sort based on position
        data.players.sort((item1, item2) => {
            return item1.ranking - item2.ranking;
        });

        const players = data.players.map((player) => {
            player.prize = getPrize(player, data);
            player.bounty = getBounty(player, data);
            player.points = getPoints(player, data);
            return player;
        });
        render('hbs/tournament.hbs', {
            date: data.date,
            playersCount: data.players.length,
            buyin: data.buyin,
            rebuys: getRebuys(data),
            players: players
        });
    }

    if (view === 'tournaments') {
        const sortedData = sortByDate(data);
        const optimizedData = sortedData.map((item) => {
            item.rebuys = getRebuys(item);
            item.hasBounty = item.bounties ? 'Yes' : 'No';
            return item;
        });
        render('hbs/tournamentsList.hbs', {
            tournaments: optimizedData,
            seasonName: seasonName
        });
    }

    if (view === 'profile') {
        setPlayers(data);
        const player = players.find((player) => player.name === playerId);
        const ranking = players.findIndex((player) => player.name === playerId) + 1;
        const tournaments = data.filter((tournament) => {
            return tournament.players.find((player) => player.name === playerId)
        });
        const sortedTournaments = sortByDate(tournaments);
        const results = [];
        sortedTournaments.forEach((item) => {
            const index = item.players.findIndex((player) => player.name === playerId);
            const result = {};
            result.date = item.date;
            result.id = item._id;
            result.ranking = item.players[index].ranking;
            result.rebuys = item.players[index].rebuys;
            result.players = item.players.length;
            result.points = getPoints(item.players[index], item);
            results.push(result);
        });
        render('hbs/profile.hbs', {
            playerId: playerId,
            points: player.points,
            rebuys: player.rebuys,
            ranking: ranking,
            results: results
        });
    }
};


declare const Handlebars: any;

interface player {
    name: string,
    rebuys: number,
    ranking: number,
    points: number,
    bounty?: number,
    prize?: number,
    games?: number
}

export interface tournament {
    _id: {},
    date: string,
    round: number,
    buyin: number,
    rebuys: number,
    prizes: number[],
    players: player[],
    season_id: string
}

interface profile {
    date: string,
    _id: {},
    ranking: number,
    rebuys: number,
    players: number,
    points: number
}

Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

const players: player[] = [];
const container = document.getElementById('results');

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

const updatePlayer = (player, clone) => {
    player.points += clone.points;
    player.bounty += clone.bounty;
    player.prize += clone.prize;
    player.rebuys += clone.rebuys;
    player.games += clone.games;
}

const addPlayers = (tournament: tournament) => {
    tournament.players.forEach((item) => {
        const clone = {...item};
        clone.points = getPoints(clone, tournament);
        clone.bounty = getBounty(clone, tournament);
        clone.prize = getPrize(clone, tournament);
        clone.games = 1;

        const foundPlayer = players.find((player) => player.name === clone.name);

        if (foundPlayer) {
            updatePlayer(foundPlayer, clone);
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

export const getHTML = async (templateFile, data) => {
    const response = await fetch(templateFile);
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    const html = template(data);
    return html;
};

const render = async (templateFile, data, container) => {
    const html = await getHTML(templateFile, data);
    container.innerHTML = html;
    container.classList.remove('empty');
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
    const data: tournament[] = options.data;
    const view = options.view;
    const playerId = options.player_id;
    const seasonId = options.season_id;
    const seasonName = options.season_name;

    if (view === 'ranking') {
        players.length = 0;
        setPlayers(data);

        render('hbs/ranking.hbs', {
            players: players,
            season_id: seasonId,
            seasonName: seasonName
        }, container);
    }

    if (view === 'tournament') {
        // if points are the same, sort based on position
        data[0].players.sort((item1, item2) => {
            return item1.ranking - item2.ranking;
        });

        const players = data[0].players.map((player) => {
            player.prize = getPrize(player, data[0]);
            player.bounty = getBounty(player, data[0]);
            player.points = getPoints(player, data[0]);
            return player;
        });

        render('hbs/tournament.hbs', {
            date: data[0].date,
            playersCount: data[0].players.length,
            buyin: data[0].buyin,
            rebuys: getRebuys(data[0]),
            players: players,
            season_id: seasonId
        }, container);
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
            season_id: seasonId,
            seasonName: seasonName
        }, container);
    }

    if (view === 'profile') {
        setPlayers(data);
        const player = players.find((player) => player.name === playerId);
        const ranking = players.findIndex((player) => player.name === playerId) + 1;
        const tournaments = data.filter((tournament) => {
            return tournament.players.find((player) => player.name === playerId)
        });
        const sortedTournaments = sortByDate(tournaments);
        const results: profile[] = [];

        sortedTournaments.forEach((item:tournament) => {
            const index = item.players.findIndex((player) => player.name === playerId);
            const result: profile = {
                date: item.date,
                _id: item._id,
                ranking: item.players[index].ranking,
                rebuys: item.players[index].rebuys,
                players: item.players.length,
                points: getPoints(item.players[index], item)
            };
            results.push(result);
        });

        render('hbs/profile.hbs', {
            player_id: playerId,
            points: player?.points,
            rebuys: player?.rebuys,
            ranking: ranking,
            results: results,
            season_id: seasonId
        }, container);
    }
};


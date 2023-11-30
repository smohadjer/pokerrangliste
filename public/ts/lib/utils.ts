import { Tournament, PlayerDB, Player, Profile } from './definitions';

declare const Handlebars: any;

Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

const container = document.getElementById('results');

export const getHTML = async (templateFile, data) => {
    const response = await fetch(templateFile);
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    const html = template(data);
    return html;
};


// season_name: getSeasonName(state.seasonId)
const getSeasonName = (seasonId, seasons) => {
    if (seasons) {
        return seasons.find(item => item._id == seasonId)?.name || 'All-Time';
    }
}

export const renderPage = (state) => {
    const data: Tournament[] = state.json.tournaments;
    const view = state.view;
    const playerId: string = state.player_id;
    const seasonId: string = state.season_id;
    const seasonName: string = getSeasonName(state.seasonId, state.json.seasons);
    const playersList: PlayerDB[] = state.json.players;

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

    const getRebuys = (tournament) => {
        let rebuys = 0;
        tournament.players.forEach((player) => {
            rebuys += player.rebuys;
        });
        return rebuys;
    };

    const getPoints = (player, tournament) => {
        const rebuys = player.rebuys * tournament.buyin;
        const prize = getPrize(player, tournament);
        const bounty = getBounty(player, tournament);
        const points = prize + bounty - tournament.buyin - rebuys;
        return points;
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
        const bountyWinner = tournament.bounties.find((item) => item.id === player.id);
        return bountyWinner ? bountyWinner.prize : 0;
    };

    const getPlayerName = (id) => {
        const player = playersList.find(player => player._id === id);
        return player?.name;
    }

    const updatePlayer = (player, clone) => {
        player.points += clone.points;
        player.bounty += clone.bounty;
        player.prize += clone.prize;
        player.rebuys += clone.rebuys;
        player.games += clone.games;
    }

    const addPlayers = (players, tournament: Tournament) => {
        tournament.players.forEach((item) => {
            const clone = {...item};
            clone.points = getPoints(clone, tournament);
            clone.bounty = getBounty(clone, tournament);
            clone.prize = getPrize(clone, tournament);
            clone.games = 1;

            const foundPlayer = players.find((player) => player.id === clone.id);

            if (foundPlayer) {
                updatePlayer(foundPlayer, clone);
            } else {
                players.push(clone);
            }
        });
    };

    const setPlayers = (data: Tournament[]) => {
        const players: Player[] = [];
        data.forEach((tournament) => {
            addPlayers(players, tournament);
        });
        players.sort((item1, item2) => {
            return item2.points - item1.points;
        });
        return players;
    };

    const players = setPlayers(data);
    const enhancedPlayers = players.map((player) => {
        player.name = getPlayerName(player.id)
        return player;
    })

    if (view === 'ranking') {
        render('hbs/ranking.hbs', {
            players: enhancedPlayers,
            season_id: seasonId,
            seasonName: seasonName
        }, container);
    }

    if (view === 'tournament') {
        // if points are the same, sort based on position
        const tournament = data.find((item) => {
            return item._id === state.tournament_id
        })
        if (!tournament) return;
        tournament.players.sort((item1, item2) => {
            return item1.ranking - item2.ranking;
        });

        const players = tournament.players.map((player) => {
            player.prize = getPrize(player, tournament);
            player.bounty = getBounty(player, tournament);
            player.points = getPoints(player, tournament);
            player.name = getPlayerName(player.id);
            return player;
        });

        render('hbs/tournament.hbs', {
            date: tournament.date,
            playersCount: tournament.players.length,
            buyin: tournament.buyin,
            rebuys: getRebuys(tournament),
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
        const player = enhancedPlayers.find((player) => player.id === playerId);
        const ranking = enhancedPlayers.findIndex((player) => player.id === playerId) + 1;
        const tournaments = data.filter((tournament) => {
            return tournament.players.find((player) => player.id === playerId)
        });

        const sortedTournaments = sortByDate(tournaments);
        const results: Profile[] = [];

        sortedTournaments.forEach((item: Tournament) => {
            const index = item.players.findIndex((player) => player.id === playerId);
            const result: Profile = {
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
            player_name: player?.name,
            points: player?.points,
            rebuys: player?.rebuys,
            ranking: ranking,
            results: results,
            season_id: seasonId
        }, container);
    }
};


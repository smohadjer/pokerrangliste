import { Tournament, PlayerDB, Player, Profile, Season, State } from './definitions';

declare const Handlebars: any;

// setting Handlebars helpers to help with compiling templates
Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

export const getHTML = async (templateFile, templateData) => {
    const response = await fetch(templateFile);
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    const html = template(templateData);
    return html;
};

const getSeasonName = (season_id: string, seasons: Season[]) => {
    return seasons.find(item => item._id == season_id)?.name || 'All-Time';
}

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

const render = async (templateFile, templateData, container) => {
    const html = await getHTML(templateFile, templateData);
    container.innerHTML = html;
    container.classList.remove('empty');
};

const getRebuys = (tournament) => {
    let rebuys = 0;
    tournament.players.forEach((player) => {
        rebuys += player.rebuys;
    });
    return rebuys;
};

const getPoints = (player, tournament: Tournament) => {
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

const getBounty = (player: Player, tournament: Tournament) => {
    if (!tournament.bounties) {
        return 0;
    }
    const bountyWinner = tournament.bounties.find((item) =>
        item.id === player.id);
    return bountyWinner ? bountyWinner.prize : 0;
};

const getPlayerName = (id: string, players: PlayerDB[]) => {
    const player = players.find(player => player._id === id);
    return player?.name;
}

const setPlayers = (tournaments: Tournament[]) => {
    const players: Player[] = [];
    tournaments.forEach((tournament) => {
        tournament.players.forEach((item) => {
            const clone = {...item};
            clone.points = getPoints(clone, tournament);
            clone.bounty = getBounty(clone, tournament);
            clone.prize = getPrize(clone, tournament);
            clone.games = 1;

            const foundPlayer = players.find(player => player.id === clone.id);

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
    });
    players.sort((item1, item2) => {
        return item2.points - item1.points;
    });
    return players;
};

export const renderPage = (state: State) => {
    const container = document.getElementById('results');
    const tournaments: Tournament[] = sortByDate(state.data!.tournaments);
    const view = state.view;
    const playerId = state.player_id;
    const season_id = state.season_id!;
    const seasonName = getSeasonName(season_id, state.data!.seasons);
    const playersList: PlayerDB[] = state.data!.players;
    const players = setPlayers(tournaments);
    const enhancedPlayers = players.map((player) => {
        player.name = getPlayerName(player.id, playersList)
        return player;
    })

    if (view === 'ranking') {
        render('hbs/ranking.hbs', {
            players: enhancedPlayers,
            season_id: season_id,
            seasonName: seasonName
        }, container);
    }

    if (view === 'tournament') {
        const tournament = tournaments.find((item) => {
            return item._id === state.tournament_id
        })
        if (!tournament) return;

        const cloneTournament = structuredClone(tournament);

        // if players have same points, list them sorted by their ranking
        cloneTournament.players.sort((item1, item2) => {
            return item1.ranking - item2.ranking;
        });

        const players = cloneTournament.players.map((player) => {
            player.prize = getPrize(player, cloneTournament);
            player.bounty = getBounty(player, cloneTournament);
            player.points = getPoints(player, cloneTournament);
            player.name = getPlayerName(player.id, playersList);
            return player;
        });

        render('hbs/tournament.hbs', {
            date: cloneTournament.date,
            playersCount: cloneTournament.players.length,
            buyin: cloneTournament.buyin,
            rebuys: getRebuys(cloneTournament),
            players: players,
            season_id: season_id
        }, container);
    }

    if (view === 'tournaments') {
        interface ClonedTournaments extends Tournament {
            hasBounty?: string;
        }
        const clonedTournaments: ClonedTournaments[] = structuredClone(tournaments);
        const optimizedData = clonedTournaments.map((item) => {
            item.rebuys = getRebuys(item);
            item.hasBounty = item.bounties ? 'Yes' : 'No';
            return item;
        });
        render('hbs/tournamentsList.hbs', {
            tournaments: optimizedData,
            season_id: season_id,
            seasonName: seasonName
        }, container);
    }

    if (view === 'profile') {
        if (!playerId) return;
        const player = enhancedPlayers.find((player) =>
            player.id === playerId);
        const ranking = enhancedPlayers.findIndex((player) =>
            player.id === playerId) + 1;
        const playerTournaments = tournaments.filter((tournament) => {
            return tournament.players.find((player) => player.id === playerId)
        });
        const sortedTournaments = sortByDate(playerTournaments);
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
            season_id: season_id
        }, container);
    }
};


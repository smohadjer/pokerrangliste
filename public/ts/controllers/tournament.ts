import { Tournament, Player, State, PlayerDB } from '../lib/definitions';
import {
    deepClone,
    getPrize,
    getBounty,
    getPoints,
    getPlayerName,
    getRebuys,
    getTournaments,
} from '../lib/utils';

export default (state: State) => {
    const tournaments: Tournament[] = getTournaments(state.data!.tournaments, 'all-time');
    const playersList: PlayerDB[] = state.data!.players;

    const tournament = tournaments.find((item) => {
        return item._id === state.tournament_id
    })
    if (!tournament) return;

    const cloneTournament = deepClone(tournament);

    // if players have same points, list them sorted by their ranking
    cloneTournament.players.sort((item1, item2) => {
        return item1.ranking - item2.ranking;
    });

    const players: Player[] = cloneTournament.players.map((player) => {
        player.prize = getPrize(player, cloneTournament);
        player.bounty = getBounty(player, cloneTournament);
        player.points = getPoints(player, cloneTournament);
        player.name = getPlayerName(player.id, playersList);
        return player;
    });

    const tournamentData = {
        date: cloneTournament.date,
        playersCount: cloneTournament.players.length,
        buyin: cloneTournament.buyin,
        rebuys: getRebuys(cloneTournament),
        players: players,
        season_id: state.season_id
    }

    return tournamentData;
};

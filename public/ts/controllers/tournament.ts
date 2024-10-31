import { Tournament, Player, RouteParams } from '../lib/types';
import {
    deepClone,
    getPrize,
    getBounty,
    getPoints,
    getPlayerName,
    getRebuys,
    getTournaments,
} from '../lib/utils';
import { store } from '../lib/store';

export default (params: RouteParams) => {
    const state = store.getState();
    const tournaments: Tournament[] = getTournaments(state.tournaments, 'all-time');

    const tournament = tournaments.find((item) => {
        return item._id === params.tournament_id
    })
    if (!tournament) return;

    const cloneTournament: Tournament = deepClone(tournament);

    // if players have same points, list them sorted by their ranking
    cloneTournament.players.sort((player1: Player, player2: Player) => {
        return player1.ranking - player2.ranking;
    });

    const players: Player[] = cloneTournament.players.map((player: Player) => {
        player.prize = getPrize(player, cloneTournament);
        player.bounty = getBounty(player, cloneTournament);
        player.points = getPoints(player, cloneTournament);
        player.name = getPlayerName(player.id);
        return player;
    });

    const tournamentData = {
        date: cloneTournament.date,
        playersCount: cloneTournament.players.length,
        buyin: cloneTournament.buyin,
        rebuys: getRebuys(cloneTournament),
        players: players,
        hasBounty: cloneTournament.bounties ? 'Yes' : 'No'
    }

    return tournamentData;
};

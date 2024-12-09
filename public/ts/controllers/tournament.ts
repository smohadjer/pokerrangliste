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
        player.prize =  (cloneTournament.status === 'upcoming') ? 0 : getPrize(player, cloneTournament);
        player.bounty =  (cloneTournament.status === 'upcoming') ? 0 : getBounty(player, cloneTournament);
        player.points = (cloneTournament.status === 'upcoming') ? 0 : getPoints(player, cloneTournament);
        player.name = getPlayerName(player.id);
        return player;
    });

    const tournamentData = {
        date: cloneTournament.date,
        playersCount: cloneTournament.players.length,
        buyin: cloneTournament.buyin,
        rebuys: getRebuys(cloneTournament),
        players: players,
        hasBounty: cloneTournament.bounties ? 'Yes' : 'No',
        status: cloneTournament.status,
        round: cloneTournament.round
    }

    return tournamentData;
};

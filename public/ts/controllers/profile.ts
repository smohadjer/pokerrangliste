import { Tournament, PlayerDB, Profile, State } from '../lib/definitions';
import { getPoints, getPlayers, getTournaments } from '../lib/utils';

export default (state: State) => {
    const tournaments: Tournament[] = getTournaments(state.data!.tournaments, state.season_id);
    const playersList: PlayerDB[] = state.data!.players;

    if (!state.player_id) return;
    const enhancedPlayers = getPlayers(tournaments, playersList);
    const player = enhancedPlayers.find((player) =>
        player.id === state.player_id);
    const ranking = enhancedPlayers.findIndex((player) =>
        player.id === state.player_id) + 1;
    const playerTournaments = tournaments.filter((tournament: Tournament) => {
        return tournament.players.find((player) => player.id === state.player_id)
    });
    const results: Profile[] = [];

    playerTournaments.forEach((item: Tournament) => {
        const index = item.players.findIndex((player) => player.id === state.player_id);
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

    const profileData = {
        player_name: player?.name,
        points: player?.points,
        rebuys: player?.rebuys,
        ranking: ranking,
        results: results,
        season_id: state.season_id
    };

    return profileData;
};

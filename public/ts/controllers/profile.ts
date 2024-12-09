import { Tournament, Profile, RouteParams } from '../lib/types';
import {
    getPoints,
    getPlayers,
    getTournaments,
    getSeasonName
} from '../lib/utils';
import { store } from '../lib/store';

export default (params: RouteParams) => {
    const state = store.getState();
    const season_id = params.season_id || state.seasons[state.seasons.length - 1]._id;
    const tournaments = getTournaments(state.tournaments, season_id);
    const tournamentsNormalized = tournaments.filter((tournament) => tournament.status !== 'upcoming')

    if (!params.player_id) return;

    const enhancedPlayers = getPlayers(tournamentsNormalized);
    const player = enhancedPlayers.find((player) =>
        player.id === params.player_id);
    const ranking = enhancedPlayers.findIndex((player) =>
        player.id === params.player_id) + 1;
    const playerTournaments = tournamentsNormalized.filter((tournament: Tournament) => {
        return tournament.players.find((player) => player.id === params.player_id)
    });
    const results: Profile[] = [];

    playerTournaments.forEach((item: Tournament) => {
        const index = item.players.findIndex((player) => player.id === params.player_id);
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
        gamesCount: playerTournaments.length,
        rebuys: player?.rebuys,
        ranking: ranking,
        results: results,
        season_id: season_id,
        seasonName:  getSeasonName(season_id!, state.seasons),
        seasons: state.seasons
    };

    return profileData;
};

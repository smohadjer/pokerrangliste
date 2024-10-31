import {
    getPlayers,
    getTournaments,
    getSeasonName
} from '../lib/utils';
import { PlayerDB, RouteParams } from '../lib/types';
import { store } from '../lib/store';

export default (params: RouteParams) => {
    const state = store.getState();
    const season_id = params.season_id || state.seasons[state.seasons.length - 1]._id;
    const tournaments = getTournaments(state.tournaments, season_id!);
    const playersList: PlayerDB[] = state.players;

    return {
        players: getPlayers(tournaments, playersList),
        season_id: season_id,
        seasonName:  getSeasonName(season_id!, state.seasons),
        seasons: state.seasons
    };
};

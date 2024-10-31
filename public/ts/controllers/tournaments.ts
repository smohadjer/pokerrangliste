import { getPlayerName, getTournaments, getSeasonName } from '../lib/utils';
import { store } from '../lib/store';
import { RouteParams } from '../lib/types';

export default (params: RouteParams) => {
    const state = store.getState();
    const season_id = params.season_id || state.seasons[state.seasons.length - 1]._id;
    const tournaments = getTournaments(state.tournaments, season_id!);

    const optimizedData = tournaments.map((item) => {
        item.firstPlace = getPlayerName(item.players[0]?.id);
        item.secondPlace = getPlayerName(item.players[1]?.id);
        return item;
    });

    const tournamentsData = {
        tournaments: optimizedData,
        season_id: season_id,
        seasonName: getSeasonName(season_id!, state.seasons),
        seasons: state.seasons
    }

    return tournamentsData;
};

import { getPlayerName, getTournaments, getSeasonName } from '../utils';
import { store } from '../lib/store';
//import { RouteParams } from '../lib/types';

export default (params: URLSearchParams) => {
    const state = store.getState();
    let season_id = params.get('season_id') ?? undefined;
    if (!season_id && state.seasons?.length > 0) {
        season_id = state.seasons[state.seasons.length - 1]._id;
    }
    const tournaments = getTournaments(state.tournaments, season_id);

    const optimizedData = tournaments.map((item) => {
        if (item.status === 'done') {
            item.firstPlace = getPlayerName(item.players[0]?.id);
            item.secondPlace = getPlayerName(item.players[1]?.id);
        }
        return item;
    });

    const tournamentsData = {
        tournaments: optimizedData,
        season_id: season_id,
        seasonName: getSeasonName(season_id!, state.seasons),
        seasons: state.seasons,
        tenant_id: params.get('tenant_id')
    }

    return tournamentsData;
};

import { getTournaments, getPlayerName, allTimeSeason } from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    // Use the most recent season if none is provided
    const season_id = params.get('season_id') ?? state.seasons[0]?._id;
    const tournaments = getTournaments(state.tournaments, season_id);
    const optimizedData = tournaments.map((item) => {
        if (item.status === 'done') {
            item.firstPlace = getPlayerName(item.players[0]?.id, state.players);
            item.secondPlace = getPlayerName(item.players[1]?.id, state.players);
        }
        return item;
    });

    return {
        tournaments: optimizedData,
        seasons: [...state.seasons, allTimeSeason],
        event_id: params.get('event_id'),
    };
};

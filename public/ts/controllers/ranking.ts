import { getSeasonName, allTimeSeason, setRankings } from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();

    const season_id = params.get('season_id');

    // if ranking for current season is not already calculated and saved in state
    // we do it so next time we visit ranking page calculations are not done again
    if (season_id) {
        if (!state.rankings[season_id]) {
            setRankings(season_id);
        }
    } else {
        if (!state.rankings.all_time) {
            setRankings(null);
        }
    }

    const rankings = season_id
        ? store.getState().rankings[season_id]
        : store.getState().rankings.all_time;

    return {
        players: rankings,
        seasonName: getSeasonName(season_id, state.seasons),
        seasons: [...state.seasons, allTimeSeason],
        event_id: params.get('event_id'),
    }
};

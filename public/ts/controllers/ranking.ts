import { getSeasonName, allTimeSeason, setRankings } from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id')!;

    // if ranking for current season is not already calculated and saved in state
    // we do it so next time we visit ranking page calculations are not done again
    if (!state.rankings[season_id]) {
        setRankings(season_id);
    }

    const rankings = store.getState().rankings[season_id];

    return {
        players: rankings,
        seasonName: getSeasonName(season_id, state.seasons),
        seasons: [...state.seasons, allTimeSeason],
        event_id: params.get('event_id'),
    }
};

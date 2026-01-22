import { getTournaments, getPlayerName, allTimeSeason } from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id')!;
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
        league_id: params.get('league_id'),
    };
};

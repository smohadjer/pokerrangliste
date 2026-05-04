import { getTournaments, getPlayerName, allTimeSeason } from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id')!;
    const tournaments = getTournaments(state.tournaments, season_id);
    const optimizedData = tournaments.map((item) => {
        const hasPlayers = item.players && item.players.length > 0;
        if ((item.status === 'done' || !item.status) && hasPlayers) {
            item.firstPlace = getPlayerName(item.players[0].id, state.players);
            item.firstPlaceId = item.players[0].id;
            if (item.players[1]) {
                item.secondPlace = getPlayerName(item.players[1].id, state.players);
                item.secondPlaceId = item.players[1].id;
            }
        }
        return item;
    });

    return {
        tournaments: optimizedData,
        seasons: [...state.seasons, allTimeSeason],
        league_id: params.get('league_id'),
    };
};

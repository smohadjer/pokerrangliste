import { getPlayerName, getTournaments, getSeasonName } from '../lib/utils';
import { store } from '../lib/store';

export default () => {
    const state = store.getState();
    const tournaments = getTournaments(state.data!.tournaments, state.season_id!);

    const optimizedData = tournaments.map((item) => {
        item.firstPlace = getPlayerName(item.players[0]?.id);
        item.secondPlace = getPlayerName(item.players[1]?.id);
        return item;
    });

    const tournamentsData = {
        tournaments: optimizedData,
        season_id: state.season_id,
        seasonName: getSeasonName(state.season_id!, state.data!.seasons),
        seasons: state.data!.seasons
    }

    return tournamentsData;
};

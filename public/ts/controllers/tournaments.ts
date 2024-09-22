import { getRebuys, getTournaments, getSeasonName } from '../lib/utils';
import { store } from '../lib/store';

export default () => {
    const state = store.getState();
    const tournaments = getTournaments(state.data!.tournaments, state.season_id!);

    const optimizedData = tournaments.map((item) => {
        item.rebuys = getRebuys(item);
        item.hasBounty = item.bounties ? 'Yes' : 'No';
        return item;
    });

    const tournamentsData = {
        tournaments: optimizedData,
        season_id: state.season_id,
        seasonName: getSeasonName(state.season_id!, state.data!.seasons),
        seasons: state.data!.seasons,
        view: 'tournaments'
    }

    return tournamentsData;
};

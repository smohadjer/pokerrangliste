import {
    getPlayers,
    getTournaments,
    getSeasonName
} from '../lib/utils';
import { PlayerDB } from '../lib/types';
import { store } from '../lib/store';

export default () => {
    const state = store.getState();
    const tournaments = getTournaments(state.data!.tournaments, state.season_id!);
    const playersList: PlayerDB[] = state.data!.players;

    return {
        players: getPlayers(tournaments, playersList),
        season_id: state.season_id,
        seasonName:  getSeasonName(state.season_id!, state.data!.seasons),
        seasons: state.data!.seasons,
        view: 'ranking'
    };
};

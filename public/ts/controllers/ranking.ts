import {
    getPlayers,
    getTournaments,
    getSeasonName
} from '../lib/utils';
import { PlayerDB, State } from '../lib/types';

export default (state: State) => {
    const tournaments = getTournaments(state.data!.tournaments, state.season_id);
    const playersList: PlayerDB[] = state.data!.players;

    return {
        players: getPlayers(tournaments, playersList),
        season_id: state.season_id,
        seasonName:  getSeasonName(state.season_id!, state.data!.seasons)
    };
};

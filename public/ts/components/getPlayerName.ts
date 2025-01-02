import { store } from '../lib/store';
import { PlayerDB } from '../lib/types';

export default (playerId: string) => {
    const state = store.getState();
    const players: PlayerDB[] = state.players;
    const player = players.find(player => player._id === playerId);
    return player?.name;
}

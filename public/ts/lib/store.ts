import { State } from '../types.js';
import { deepClone } from './utils.js';

class Store {
    #state: State = {
        dataIsStale: true,
        events: [],
        tournaments: [],
        players: [],
        seasons: [],
        tenant: {
            name: undefined,
            id: undefined
        },
        rankings: {},
        season_id: ''
    };

    getState(): State {
        return deepClone(this.#state);
    }

    setState(state: State) {
        this.#state = deepClone(state);
    }
}

export const store = new Store();

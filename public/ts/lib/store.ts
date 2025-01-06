import { State } from './types.js';
import { deepClone } from './utils.js';

type StateOptions = {
    payload: any;
};

type Store = {
    state: State,
    getState: Function,
    setState: Function
};

export const store: Store = {
    state: {
        dataIsStale: true,
        events: [],
        tournaments: [],
        players: [],
        seasons: [],
        tenant: {
            name: undefined,
            id: undefined
        }
    },
    getState: () => {
        return deepClone(store.state);
    },
    setState: (options: StateOptions) => {
        for (const key in options) {
            if (store.state.hasOwnProperty(key)) {
                store.state[key] = options[key];
            }
        }
    }
}

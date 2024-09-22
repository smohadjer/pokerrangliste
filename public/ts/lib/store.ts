import { State } from './types.js';
import { deepClone } from './utils.js';

type StateOptions = {
    payload: any,
    action?: Function
};

type Store = {
    state: State,
    getState: Function,
    setState: Function
};

export const store: Store = {
    state: {
        season_id: undefined,
        tournament_id: undefined,
        player_id: undefined,
        view: 'ranking',
        data: undefined,
    },
    getState: () => {
        return deepClone(store.state);
    },
    setState: (options: StateOptions) => {
        for (const key in options.payload) {
            if (store.state.hasOwnProperty(key)) {
                store.state[key] = options.payload[key];
            }
        }

        if (typeof options.action === 'function') {
            options.action();
        }
    }
}

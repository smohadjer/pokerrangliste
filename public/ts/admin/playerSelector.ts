import { State } from '../lib/types';
import { store } from '../lib/store.js';

export const initPlayer = async (container: HTMLElement) => {
    console.log('initializing Admin Player');
    const state: State = store.getState();
    const select = container.querySelector('#player_edit_dropdown');

    if (select) {
        initPlayerSelector(select, state);
    }
}

function initPlayerSelector(selector: Element, state: State) {
    let playersSelect = '';
    state.players.forEach(item => {
        playersSelect += `<option value="${item._id}">${item.name}</option>`
    });

    selector.parentElement?.classList.remove('loading');
    const myHtmlElement = new DOMParser().parseFromString(playersSelect,
        'text/html').body.children;
    selector.append(...myHtmlElement);
}



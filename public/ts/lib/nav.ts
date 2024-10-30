import { renderPage } from './renderPage.js';
import { store } from './store.js';
import { pushHistory } from './pushHistory.js';

export const onChangeEventHandler = async (target: HTMLSelectElement) => {
  store.setState ({
    payload: {
      season_id: target.value ? target.value : undefined
    }
  });

  await renderPage();
  pushHistory();

};

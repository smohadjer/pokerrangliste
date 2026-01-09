import { router } from '../lib/router.js';
import { RenderPageOptions } from '../types.js';

export const initSeasonSelector = (seasonSelector: HTMLSelectElement) => {
  seasonSelector.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('season_id', event.target.value);
      const params = urlParams.toString();
      const options: RenderPageOptions = {
        type: 'click'
      };
      router(window.location.pathname, params, options);
    }
});
}


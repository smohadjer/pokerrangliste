import { router } from '../lib/router.js';
import { RenderPageOptions } from '../lib/types.js';

export const initSeasonSelector = (seasonSelector: HTMLSelectElement) => {
  seasonSelector.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement) {
      const urlParams = new URLSearchParams(window.location.search);
      if (event.target.value) {
        urlParams.set('season_id', event.target.value);
      } else {
        urlParams.delete('season_id');
      }
      const params = urlParams.toString();
      const options: RenderPageOptions = {
        type: 'click'
      };
      router(window.location.pathname, params, options);
    }
});
}


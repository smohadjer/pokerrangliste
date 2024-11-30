import profile from './profile';
import tournament from './tournament';
import tournaments from './tournaments';
import ranking from './ranking';

export const controller = {
    '/profile': profile,
    '/tournament': tournament,
    '/tournaments': tournaments,
    '/ranking': ranking
};

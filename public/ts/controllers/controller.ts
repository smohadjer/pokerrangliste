import profile from './profile';
import tournament from './tournament';
import tournaments from './tournaments';
import ranking from './ranking';
import dashboard from './dashboard';
import addTournament from './addTournament';
import editTournament from './editTournament';
import duplicateTournament from './duplicateTournament';
import deleteTournament from './deleteTournament';
import addEditSeason from './addEditSeason';
import addEditPlayer from './addEditPlayer';
import editLeague from './editLeague';
import home from './home';

type Controller = {
    [key:string]: Function;
}

/* controllers provide data to views */
export const controller: Controller = {
    '/home': home,
    '/profile': profile,
    '/tournament': tournament,
    '/tournaments': tournaments,
    '/ranking': ranking,
    '/admin/home': dashboard,
    '/admin/add-tournament': addTournament,
    '/admin/edit-tournament': editTournament,
    '/admin/duplicate-tournament': duplicateTournament,
    '/admin/delete-tournament': deleteTournament,
    '/admin/add-edit-season': addEditSeason,
    '/admin/add-edit-player': addEditPlayer,
    '/admin/edit-league': editLeague,
};

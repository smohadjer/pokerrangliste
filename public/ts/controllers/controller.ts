import { getProfileData } from './profile';
import { getTournamentData } from './tournament';
import { getTournamentsData } from './tournaments';
import { getRankingData } from './ranking';

export const controller = {
    profile: {
        getData: getProfileData
    },
    tournament: {
        getData: getTournamentData
    },
    tournaments: {
        getData: getTournamentsData
    },
    ranking: {
        getData: getRankingData
    }
};

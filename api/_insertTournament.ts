import { sanitize } from './_sanitize.js';

interface Player {
    id: string;
    rebuys: number;
    ranking: number;
    prize: number;
}

const getRebuys = (players) => {
    let rebuys = 0;
    players.forEach((player) => {
        rebuys += player.rebuys;
    });
    return rebuys;
};

export const insertTournament = async (tournaments, req) => {
    const count = Number(req.body.count);
    const status = sanitize(req.body.status);
    const players: Player[] = [];
    const prizes: number[] = [];
    const dataIsValid = () => {
      const totalprize = prizes.reduce((accumulator, currentValue) => {
        return accumulator + currentValue
      }, 0);
      const buyIns = count * req.body.buyin;
      const rebuysTotal = getRebuys(players) * req.body.buyin;
      console.log({rebuysTotal});

      return totalprize === buyIns + rebuysTotal;
    };

    for (let i=0; i<count; i++) {
      const player: Player = <Player>{};
      const prize = Number(sanitize(req.body[`players_${i}_prize`]));
      player.id = req.body[`players_${i}_id`];
      player.rebuys = Number(sanitize(req.body[`players_${i}_rebuys`]));
      player.ranking = Number(sanitize(req.body[`players_${i}_ranking`]));
      player.prize = Number(sanitize(req.body[`players_${i}_prize`]));
      players.push(player);
      if (prize > 0) {
        prizes.push(prize);
      }
    }

    // sort players based on ranking for backward compatibility
    players.sort((player1, player2) => player1.ranking - player2.ranking)

    // if tournament is done validate data
    if (status === 'done' && !dataIsValid()) {
      return;
    }

    const insertResponse = await tournaments.insertOne({
      season_id: req.body.season_id,
      date: sanitize(req.body.date),
      round: sanitize(req.body.round),
      status: status,
      buyin: sanitize(req.body.buyin),
      prizes: prizes,
      players: players
    });

    return insertResponse.insertedId;
};

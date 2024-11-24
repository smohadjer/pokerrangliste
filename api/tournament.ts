import client from './db.js';
import { sanitize } from './_sanitize.js';
import { ObjectId } from 'mongodb';

const getTournaments = async (tournaments, seasonId: string, id: string = undefined) => {
  const query = (seasonId) ? {'season_id': seasonId} : {};
  const sortQuery = {'date': -1};

  if (id) {
    const tournament = await tournaments.findOne({
      _id: new ObjectId(id)
    });
    return [tournament];
  } else {
    return await tournaments.find(query).sort(sortQuery).toArray();
  }
};

const getRebuys = (players) => {
  let rebuys = 0;
  players.forEach((player) => {
      rebuys += player.rebuys;
  });
  return rebuys;
};

interface Player {
  id: string;
  rebuys: number;
  ranking: number;
}

const insertTournament = async (tournaments, req) => {
  const count = Number(req.body.count);
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
    player.ranking = i+1;
    players.push(player);
    if (prize > 0) {
      prizes.push(prize);
    }
  }

  if (!dataIsValid()) {
    return;
  }

  const insertResponse = await tournaments.insertOne({
    season_id: req.body.season_id,
    date: sanitize(req.body.date),
    round: sanitize(req.body.round),
    buyin: sanitize(req.body.buyin),
    prizes: prizes,
    players: players
  });

  return insertResponse.insertedId;
};

const validateData = (req) => {
  if (!req.body.count) {
    return false;
  }

  return true;
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db('pokerrangliste');
    const tournaments = database.collection('tournaments');
    const seasons = database.collection('seasons');
    const players = database.collection('players');

    if (req.method === 'GET') {
      const data = {
        seasons: await seasons.find().toArray(),
        players: await players.find().sort({'name': 1}).toArray(),
        tournaments: await getTournaments(tournaments, req.query.season_id, req.query.tournament_id)
      };
      res.json(data);
    }

    if (req.method === 'POST') {
      if (!req.body.count) {
        return res.status(500).send({
          error: 'Invalid data, count not set!'
        });
      }

      const tournament_id = await insertTournament(tournaments, req);
      if (tournament_id) {
        // return all tournaments so state in app can be updated from response
        const tournamentsData = await getTournaments(tournaments, req.body.season_id);
        res.json({
          data: {
            tournaments: tournamentsData
          }
        });

        // res.status(200).send({
        //   message: 'Tournament inserted!',
        //   tournament_id: tournament_id
        // });
      } else {
        res.status(500).send({
          error: 'Invalid data!'
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: 500,
      message: error
    });
  } finally {
    await client.close();
  }
}

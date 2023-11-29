import client from './db.js';
import { sanitize } from './sanitize.js';
import { ObjectId } from 'mongodb';

const getTournaments = async (tournaments, req) => {
  const seasonId =  req.query.season_id;
  const id = req.query.tournament_id;
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

const insertTournament = async (tournaments, req) => {
  const count = Number(req.body.count);
  const players = [];
  const prizes = [];
  let rebuys = 0;
  const dataIsValid = () => {
    const totalprize = prizes.reduce((accumulator, currentValue) => {
      return accumulator + currentValue
    },0);
    const buyIns = count * req.body.buyin;
    const rebuysTotal = req.body.buyin * rebuys;

    return totalprize === buyIns + rebuysTotal;
  };

  for (let i=0; i<count; i++) {
    const player = {};
    const prize = Number(sanitize(req.body[`players_${i}_prize`]));
    player.id = req.body[`players_${i}_id`];
    player.rebuys = Number(sanitize(req.body[`players_${i}_rebuys`]));
    player.ranking = i+1;
    players.push(player);

    if (player.rebuys > 0) {
      rebuys += player.rebuys;
    }

    if (prize > 0) {
      prizes.push(prize);
    }
  }

  if (!dataIsValid(req.body)) {
    return;
  }

  const insertResponse = await tournaments.insertOne({
    season_id: req.body.season_id,
    date: sanitize(req.body.date),
    round: sanitize(req.body.round),
    buyin: sanitize(req.body.buyin),
    rebuys: rebuys,
    prizes: prizes,
    players: players
  });

  return insertResponse.insertedId;
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
        tournaments: await getTournaments(tournaments, req)
      };
      res.json(data);
    }

    if (req.method === 'POST') {
      const tournament_id = await insertTournament(tournaments, req);
      if (tournament_id) {
        res.status(200).send({
          message: 'Tournament inserted!',
          tournament_id: tournament_id
        });
      } else {
        res.status(500).send({
          error: 500,
          message: 'Invalid data!'
        });
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

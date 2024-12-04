import client from './db.js';
import { ObjectId } from 'mongodb';
import { insertTournament } from './_insertTournament.js';

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

const editTournament = async (tournaments, req) => {

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

      if (req.body.tournament_id) {
        editTournament(tournaments, req);
      } else {
        const tournament_id = await insertTournament(tournaments, req);
        if (tournament_id) {
          // return all tournaments so state in app can be updated from response
          const tournamentsData = await getTournaments(tournaments, req.body.season_id);
          res.json({
            data: {
              tournaments: tournamentsData
            }
          });
        } else {
          res.status(500).send({
            error: 'Invalid data!'
          });
        }
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

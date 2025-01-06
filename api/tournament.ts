import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import {
  getTournament,
  getTournaments,
  insertTournament,
  editTournament
} from './_utils.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();

    const database = client.db(database_name);
    const tournamentsCol = database.collection('tournaments');
    const seasonsCol = database.collection('seasons');
    const playersCol = database.collection('players');

    if (req.method === 'GET') {
      const event_id = req.query.event_id;
      const tournaments = req.query.tournament_id
        ? await getTournament(tournamentsCol, event_id, req.query.tournament_id)
        : await getTournaments(tournamentsCol, event_id, req.body.season_id);
      const data = {
        seasons: await seasonsCol.find({event_id}).toArray(),
        players: await playersCol.find({event_id}).sort({ name: 1 }).toArray(),
        tournaments: tournaments
      };
      res.json(data);
    }

    if (req.method === 'POST') {
      const event_id = req.body.event_id;
      if (!event_id || event_id.length === 0) {
        throw new Error('No tenant ID provided');
      }
      if (req.body.tournament_id) {
        const response = await editTournament(tournamentsCol, req, req.body.tournament_id);
        if (response && response.modifiedCount > 0) {
          console.log('edited tournament successfully');
          // return all tournaments so state in app can be updated from response
          const tournamentsData = await getTournaments(tournamentsCol, event_id);
          res.json({
            data: {
              tournaments: tournamentsData
            }
          });
        } else {
          throw new Error('Invalid data');
        }
      } else {
        const tournament_id = await insertTournament(tournamentsCol, req);
        if (tournament_id) {
          // return all tournaments so state in app can be updated from response

          const tournamentsData = await getTournaments(tournamentsCol, event_id);
          res.json({
            data: {
              tournaments: tournamentsData
            }
          });
        } else {
          throw new Error('Failed to insert tournament');
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

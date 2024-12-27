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
      const tenant_id = req.query.tenant_id;
      const tournaments = req.query.tournament_id
        ? await getTournament(tournamentsCol, tenant_id, req.query.tournament_id)
        : await getTournaments(tournamentsCol, tenant_id, req.body.season_id);
      const data = {
        seasons: await seasonsCol.find({tenant_id}).toArray(),
        players: await playersCol.find({tenant_id}).sort({ name: 1 }).toArray(),
        tournaments: tournaments
      };
      res.json(data);
    }

    if (req.method === 'POST') {
      const tenant_id = req.body.tenant_id;
      if (!tenant_id || tenant_id.length === 0) {
        throw new Error('No tenant ID provided');
      }
      if (req.body.tournament_id) {
        const response = await editTournament(tournamentsCol, req, req.body.tournament_id);
        if (response && response.modifiedCount > 0) {
          console.log('edited tournament successfully');
          // return all tournaments so state in app can be updated from response
          const tournamentsData = await getTournaments(tournamentsCol, tenant_id);
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

          const tournamentsData = await getTournaments(tournamentsCol, tenant_id);
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

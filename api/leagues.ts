import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import {
  fetchAllLeagues,
  editLeagueName,
  addNewLeague,
  getIdFromToken
} from './_utils.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('leagues');

    if (req.method === 'GET') {
      const tenant_id = req.query.tenant_id;
      const leagues = await fetchAllLeagues(collection, tenant_id);
      res.json(leagues);
    }

    if (req.method === 'POST') {
      const tenant_id = await getIdFromToken(req.cookies.jwt);
      if (!tenant_id) {
        throw new Error('No tenant ID provided');
      }

      const name = req.body.name;
      const leagueId = req.body.league_id;
      const doc = await collection.findOne({tenant_id, name});

      if (doc) {
        throw new Error(`Name ${name} is already taken`);
      }

      if (leagueId) {
        await editLeagueName(name, leagueId, collection, tenant_id);
      } else {
        await addNewLeague(name, collection, tenant_id);
      }

      // return all leagues so state in app can be updated from response
      const leagues = await fetchAllLeagues(collection, tenant_id);
      res.json({
        data: { leagues }
      });

    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}

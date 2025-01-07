import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { fetchAllSeasons, editSeasonName, addNewSeason } from './_utils.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('seasons');

    if (req.method === 'GET') {
      const event_id = req.query.event_id;
      const docs = await collection.find({event_id}).sort({'name': 1}).toArray()
      res.json(docs);
    }

    if (req.method === 'POST') {
      const event_id = req.body.event_id;
      if (!event_id || event_id.length === 0) {
        throw new Error('No tenant ID provided');
      }
      const name = req.body.name;
      const seasonId = req.body.season_id;
      const doc = await collection.findOne({event_id, name});

      if (doc) {
        res.status(500).json({error: `Name ${name} is already taken`});
        return;
      }

      if (seasonId) {
        await editSeasonName(name, seasonId, collection, event_id);
      } else {
        await addNewSeason(name, collection, event_id);
      }

      // return all seasons so state in app can be updated from response
      const seasons = await fetchAllSeasons(collection, event_id);
      res.json({
        data: { seasons }
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

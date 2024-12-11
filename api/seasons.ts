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
      const docs = await collection.find().sort({'name': 1}).toArray()
      res.json(docs);
    }

    if (req.method === 'POST') {
      const name = req.body.name;
      const seasonId = req.body.season_id;
      const doc = await collection.findOne({'name': name});

      if (doc) {
        res.status(500).json({error: `Name ${name} is already taken`});
        return;
      }

      if (seasonId) {
        await editSeasonName(name, seasonId, collection);
      } else {
        await addNewSeason(name, collection);
      }

      // return all seasons so state in app can be updated from response
      const seasons = await fetchAllSeasons(collection);
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

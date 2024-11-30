import client from './db.js';
import { ObjectId } from 'mongodb';
import { fetchAllSeasons } from './_utils.js';

const editSeasonName = async (name, seasonId, collection) => {
  const query = { _id: new ObjectId(seasonId) };
  await collection.updateOne(query, {
      $set: {
        name: name
      }
  });
  console.log(`Changed name of an existing season to ${name}`);
};

const addNewSeason = async (name, collection) => {
  const insertResponse = await collection.insertOne({ name: name });
  console.log(`Added new season with name ${name} and id `, insertResponse.insertedId);
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db('pokerrangliste');
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

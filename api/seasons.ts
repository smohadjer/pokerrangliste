import client from './db.js';
import { fetchAllSeasons } from './_utils.js';

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
      const doc = await collection.findOne({'name': name});

      if (!doc) {
        const insertResponse = await collection.insertOne({'name': name});
        const seasonsData = await fetchAllSeasons(collection);
        //res.json({'id': insertResponse.insertedId});
        res.json({
          data: {
            seasons: seasonsData
          }
        })
      } else {
        res.status(500).json({error: 'Invalid season name'});
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

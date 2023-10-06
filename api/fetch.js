import client from './db.js';
import { ObjectId } from 'mongodb';

async function run(req) {
  try {
    await client.connect();

    const seasonId = req.body.seasonId;
    const database = client.db('pokerrangliste');
    const collection = database.collection('tournaments');
    const query = (seasonId === 'all-time') ? {} : {'season_id': seasonId};
    const seasonsCollection = database.collection('seasons');
    const seasonsData = await seasonsCollection.find().toArray();
    const data = {
      seasons: seasonsData,
      tournaments: []
    };

    if (req.body.tournament_id) {
      data.tournaments = await collection.findOne({
        _id: new ObjectId(req.body.tournament_id)
      });
    } else {
      //const query = { "status" : { "$exists" : false } };
      data.tournaments = await collection.find(query).toArray();
    }

    return data;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

export default async (req, res) => {
  const data = await run(req).catch(console.dir);

  res.json(data);
  //res.status(200).send(table);
}

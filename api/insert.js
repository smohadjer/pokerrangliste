import path from 'path';
import uri from './db.js';
import { MongoClient } from 'mongodb';
import { sanitize } from './sanitize.js';

const client = new MongoClient(uri);

async function run(req) {
  try {
    console.log('openning db...');
    await client.connect();
    const database = client.db('test');
    console.log(req.body);
    return;
    const collection = database.collection('tournaments');
    await collection.insertOne({
      date: sanitize(req.body.date),
      round: sanitize(req.body.round),
      buyin: sanitize(req.body.buyin),
      rebuys: 0
    });
  } catch (e) {
    console.error(e);
  } finally {
    console.log('closing db...');
    //Ensures that the client will close when you finish/error
    await client.close();
  }
}

export default async (req, res) => {
  //write data to database
  await run(req);

  res.status(200).send({ message: "Tournament inserted" });
}

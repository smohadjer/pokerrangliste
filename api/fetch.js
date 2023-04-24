import uri from './db.js';
import { MongoClient } from 'mongodb';

const client = new MongoClient(uri);

async function run() {
  try {
    console.log('openning db...');
    await client.connect();
    const database = client.db('test');
    const users = database.collection('poker2023');
    const data = await users.find({}).sort({ Siege: -1, Spiele: 1, Name: 1 }).toArray();
    return data;
  } catch (e) {
    console.error(e);
  } finally {
    //Ensures that the client will close when you finish/error
    console.log('closing db...');
    await client.close();
  }
}

export default async (req, res) => {
  const data = await run().catch(console.dir);

  res.json({data: data});
  //res.status(200).send(table);
}

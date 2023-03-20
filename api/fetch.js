import uri from './db.js';
import { MongoClient } from 'mongodb';

const client = new MongoClient(uri);

async function run() {
  try {
    console.log('openning db...');
    await client.connect();
    const database = client.db('test');
    const users = database.collection('customers');
    const data = await users.find({}).toArray();
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

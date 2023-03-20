import uri from './db.js';
import { MongoClient } from 'mongodb';

const client = new MongoClient(uri);

async function run(req) {
  try {
    console.log('openning db...');
    await client.connect();
    const database = client.db('test');
    const users = database.collection('customers');
    await users.insertOne({
      firstname: req.body.firstname.trim(),
      lastname: req.body.lastname.trim(),
      age: req.body.age.trim()
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
    await run(req);
    return res.send('done');
}

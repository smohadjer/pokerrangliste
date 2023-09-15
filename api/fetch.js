import uri from './db.js';
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(uri);

async function run(req) {
  try {
    const dbName = req.body.db || 'test';
    const seasonId = req.body.seasonId;
    console.log('openning db...');

    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection('tournaments');
    let data;

    const query = seasonId ? {"seasonId": seasonId} : {};

    if (req.body.id) {
      console.log(req.body.id);
      data = await collection.findOne({_id: new ObjectId(req.body.id)});
    } else {
      //const query = { "status" : { "$exists" : false } };
      data = await collection.find(query).toArray();
    }

    console.log(data);

    //const data = await collection.find().toArray();
    //const data = await users.find({}).sort({ Siege: -1, Spiele: 1, Name: 1 }).toArray();
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
  const data = await run(req).catch(console.dir);

  res.json({data: data});
  //res.status(200).send(table);
}

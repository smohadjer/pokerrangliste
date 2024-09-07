import client from './db.js';

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
        res.json({'id': insertResponse.insertedId});
      } else {
        res.status(500).json({'error': 'invalid name'});
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

import client from './db.js';

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db('pokerrangliste');
    const collection = database.collection('players');

    if (req.method === 'GET') {
      const players = await collection.find().sort({'name': 1}).toArray()
      res.json(players);
    }

    if (req.method === 'POST') {
      const name = req.body.name;
      const player = await collection.findOne({'name': name});

      if (!player) {
        const insertResponse = await collection.insertOne({'name': name});
        res.json({'id': insertResponse.insertedId});
      } else {
        res.status(500).json({'error': 'Player already exists.'});
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

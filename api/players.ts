import client from './db.js';
import { ObjectId } from 'mongodb';

const addNewPlayer = async (collection, doc, res) => {
  if (!doc) {
    const insertResponse = await collection.insertOne({'name': name});
    res.json({'id': insertResponse.insertedId});
  } else {
    res.status(500).json({'error': 'Invalid name!'});
  }
};

const editPlayerName = async (playerId, collection, doc, res) => {
  if (doc) {
    res.status(500).json({'error': 'Name already taken'});
  } else {
    await collection.updateOne(
      { _id: playerId },
      {
        $set: {
          name: name
        }
      }
    );
    res.json({'id': playerId});
  }
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db('pokerrangliste');
    const collection = database.collection('players');

    if (req.method === 'GET') {
      const docs = await collection.find().sort({'name': 1}).toArray()
      res.json(docs);
    }

    if (req.method === 'POST') {
      const name = req.body.name;
      const doc = await collection.findOne({'name': name});

      if (req.body._method === 'PUT') {
        addNewPlayer(collection, doc, res);
      } else {
        const playerId = new ObjectId(req.body.player_id);
        editPlayerName(playerId, collection, doc, res);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

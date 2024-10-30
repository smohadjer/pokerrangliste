import client from './db.js';
import { ObjectId } from 'mongodb';

const editPlayerName = async (name, playerId, collection, doc, res) => {
  const query = { _id: new ObjectId(playerId) };
  if (doc) {
    res.status(500).json({'error': 'Name already taken'});
  } else {
    await collection.updateOne(query, {
        $set: {
          name: name
        }
    });
    const player = await collection.findOne(query);
    res.json(player);
  }
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db('pokerrangliste');
    const collection = database.collection('players');

    if (req.method === 'GET') {
      const id = req.query?.id;
      const name = req.query?.name;
      if (id || name) {
        const query = id ? { _id: new ObjectId(id)} : { name: name };
        const doc = await collection.findOne(query);
        if (doc) {
          res.json(doc);
        } else {
          res.status(404).end();
        }
      } else {
        const docs = await collection.find()
          // using collation so sort is case insensitive
          .collation({ locale: 'en' })
          .sort({ name: 1 })
          .toArray();
        res.json(docs);
      }
    }

    if (req.method === 'POST') {
      const name = req.body.name;
      const playerId = req.body.player_id;
      const doc = await collection.findOne({ name: name });

      if (playerId) {
        await editPlayerName(name, playerId, collection, doc, res);
      } else {
        // add new player
        if (doc) {
          res.status(500).json({ 'error': 'Name already exits!' });
        } else {
          const insertResponse = await collection.insertOne({ name: name });
          const player = await collection.findOne({
            _id: new ObjectId(insertResponse.insertedId)
          });
          res.json(player);
        }
      }
    }

    if (req.method === 'DELETE') {
      const result = await collection.deleteOne( { name: req.query.name });
      console.log(result);
      if (result.deletedCount > 0) {
        res.end();
      } else {
        res.json({'Error': 'Delete failed!'});
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

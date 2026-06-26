import { MongoClient, ObjectId } from 'mongodb';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { database_uri, database_name } from './_config.js';

const client = new MongoClient(database_uri);
const defaultImagePath = path.join(process.cwd(), 'public', 'assets', 'players', 'default.png');

export default async (req, res) => {
  try {
    const playerId = typeof req.query.player_id === 'string' ? req.query.player_id : '';
    if (!playerId) {
      res.status(400).json({ error: 'player_id is required' });
      return;
    }

    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('players');
    const player = await collection.findOne(
      { _id: ObjectId.createFromHexString(playerId) },
      { projection: { photo_content_type: 1, photo_data_base64: 1 } }
    );

    if (player?.photo_content_type && player?.photo_data_base64) {
      res.setHeader('Content-Type', player.photo_content_type);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.status(200).send(Buffer.from(player.photo_data_base64, 'base64'));
      return;
    }

    const defaultImage = await readFile(defaultImagePath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(defaultImage);
  } catch (error) {
    res.status(404).end();
  } finally {
    await client.close();
  }
};

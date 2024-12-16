import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import bcrypt from 'bcrypt';

const client = new MongoClient(database_uri);
const saltRounds = 10;

export default async (req, res) => {
  const { username, password } = req.body;

  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('tenants');

    if (req.method === 'POST') {
      if (password.length < 8) {
        throw new Error('password is too short');
      }

      const doc = await collection.findOne({ username: username });
      if (doc) {
        throw new Error(`Username ${username} is already taken`);
      }

      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
      const user = {
        username: username,
        password: hashedPassword
      }
      const insertResponse = await collection.insertOne(user);
      res.status(201).json({message: `User ${username} is registered`});
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  }
}



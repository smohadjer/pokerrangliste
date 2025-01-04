import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('tenants');

    if (req.method === 'GET') {
      // we use projection so password field is not returned as we only need username and _id fields in frontend (_id is returned by default)
      const tenants = await collection.find({},
        {
          projection: { username: 1 },
        }
      ).toArray();
      const normalizedTenants = tenants.map(item => {
        return {
          _id: item._id,
          name: item.username
        }
      });
      res.json(normalizedTenants);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

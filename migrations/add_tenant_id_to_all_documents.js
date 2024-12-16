/*
Run this script in terminal from root of porject using node migrationes/add_tenant_id_to_all_collections.js to add tenant_id to all documents in a collection
*/

import { MongoClient } from 'mongodb';
import { database_uri, database_name } from '../api/_config.js';
const client = new MongoClient(database_uri);


async function run() {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('tournaments');
    const result = await collection.updateMany({}, {
      $set: {
        tenant_id: '675d5c55b15a8b71890bb061'
      }
    });
    console.log(`Updated ${result.modifiedCount} documents`);
  } finally {
    // Close the connection after the operation completes
    await client.close();
  }
}

// Run the program and print any thrown exceptions
run().catch(console.dir);

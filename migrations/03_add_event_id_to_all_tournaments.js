/*
Run this script in terminal from root of porject using command `node migrations/[script.js]`. Rename `api/_config.ts` to `api/_config.js` before running script and undo afterwards.
*/

import { MongoClient } from 'mongodb';
import { database_uri, database_name } from '../api/_config.js';
const client = new MongoClient(database_uri);

async function run() {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('seasons');
    const result = await collection.updateMany({}, {
      $set: {
        event_id: '677cc26c5462214b2a1ac7a0'
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

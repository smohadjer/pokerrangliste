// this script finds all documents and deletes rebuys property from them
import client from '../api/db.js';

async function run() {
  await client.connect();

  try {
    const db = client.db('pokerrangliste');
    const result = await db.collection('tournaments').updateMany({}, {$unset: {rebuys: 1}});
    //console.log(`Modified ${result.modifiedCount} document(s)`);

    //const result = await db.collection('tournaments').updateMany(query, updateDoc);
   // console.log(`Updated ${result.modifiedCount} documents`);
  } finally {
    // Close the connection after the operation completes
    await client.close();
  }
}

// Run the program and print any thrown exceptions
run().catch(console.dir);

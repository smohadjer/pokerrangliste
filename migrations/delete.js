import client from '../api/db.js';

const query1 = { players: { $eq: [] } }; // deletes tournaments which have no players
const query2 = { season_id: "2024"};

async function run() {
  await client.connect();

  try {
    const db = client.db('pokerrangliste');
    const result = await db.collection('tournaments').deleteMany(query2);
    console.log("Deleted " + result.deletedCount + " documents");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

// this script finds all documents and deletes player.name from players array

import client from '../api/db.js';

const updateTournament = (tournament, playersList) => {
  tournament.players.map((player) => {
    delete player.name;
  })
  return tournament;
}

async function run() {
  await client.connect();

  try {
    const db = client.db('pokerrangliste');
    const playersList = await db.collection('players').find().toArray();

    const tournaments = await db.collection('tournaments').find().toArray();

    for (const tournament of tournaments) {
      const id = tournament._id;
      const replacement = updateTournament(tournament, playersList);
      delete replacement._id; // because replaceOne doesn't change _id of old document if we don't specify a new _id
      const result = await db.collection('tournaments').replaceOne({_id: id }, replacement);
      console.log(`Modified ${result.modifiedCount} document(s)`);
    }

    //const result = await db.collection('tournaments').updateMany(query, updateDoc);
   // console.log(`Updated ${result.modifiedCount} documents`);
  } finally {
    // Close the connection after the operation completes
    await client.close();
  }
}

// Run the program and print any thrown exceptions
run().catch(console.dir);

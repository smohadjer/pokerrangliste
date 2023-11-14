// this script finds all documents that have bounties property and adds player.id to objects in that property

import client from '../api/db.js';

//const query = {};

const getId = (name, playersList) => {
  const player = playersList.find(player => player.name.toLowerCase() === name.toLowerCase());
  if (player) {
    return player._id;
  }
};

const updateTournament = (tournament, playersList) => {
  if (!tournament.bounties) {
    return;
  }

  tournament.bounties.map((player) => {
    player.id = getId(player.name, playersList);
  })
  return tournament;
}

async function run() {
  await client.connect();

  try {
    const db = client.db('pokerrangliste');
    const playersList = await db.collection('players').find().toArray();

    const tournaments = await db.collection('tournaments').find({ 'bounties': { $exists: true } }).toArray();
    console.log(tournaments.length);
    let count = 0
    for (const tournament of tournaments) {
      const id = tournament._id;
      const replacement = updateTournament(tournament, playersList);
      delete replacement._id; // because replaceOne doesn't change _id of old document if we don't specify a new _id
      const result = await db.collection('tournaments').replaceOne({_id: id }, replacement);
      console.log(`Modified ${result.modifiedCount} document(s)`);
      count++;
    }

    console.log({count});

    //const result = await db.collection('tournaments').updateMany(query, updateDoc);
   // console.log(`Updated ${result.modifiedCount} documents`);
  } finally {
    // Close the connection after the operation completes
    await client.close();
  }
}

// Run the program and print any thrown exceptions
run().catch(console.dir);

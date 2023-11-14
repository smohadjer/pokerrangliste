import client from './../api/db.js';
import { ObjectId } from 'mongodb';

const getId = (name, players) => {
  const player = players.find(player => player.name.toLowerCase() === name);
  if (player) {
    return player._id;
  }
};

async function migration() {
  await client.connect();
  const database = client.db('pokerrangliste');
  const seasons = database.collection('seasons');
  const playersCollection = database.collection('players');
  //const tournaments = await tournamentsCollection.find().toArray();
  const playersList = await playersCollection.find().toArray();
  //console.log(tournaments);

  const aggCursor = database
    .collection('tournaments')
    .aggregate([
      {
        '$match': {
          'players': {
            '$type': 'array',
            '$eq': []
          }
        }
      }
    ]);

    for await (const doc of aggCursor) {
      console.log(doc);
    }



  //console.log(idsList);

  /*
  tournaments.forEach((item) => {
    const players = item.players;
    players.forEach((player) => {
      const name = player.name;
      const id = getId(name, playersList);
      if (id) {
        //console.log(name, id.toString());
      }
    });
  })
  */

  await client.close();
}

await migration();


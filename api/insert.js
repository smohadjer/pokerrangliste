import path from 'path';
import uri from './db.js';
import { MongoClient } from 'mongodb';
import { sanitize } from './sanitize.js';

const client = new MongoClient(uri);

async function run(req) {
  try {
    console.log('openning db...');
    await client.connect();
    const database = client.db('test');
    const count = Number(req.body.count);
    const players = [];
    const prizes = [];
    let rebuys = 0;

    for (let i=0; i<count; i++) {
      console.log(req.body[`players_${i}_name`]);
      const player = {};
      const prize = Number(sanitize(req.body[`players_${i}_prize`]));
      player.name = sanitize(req.body[`players_${i}_name`]).toLowerCase();
      player.rebuys = Number(sanitize(req.body[`players_${i}_rebuys`]));
      player.ranking = i+1;
      players.push(player);

      if (player.rebuys > 0) {
        rebuys += player.rebuys;
      }

      if (prize > 0) {
        prizes.push(prize);
      }
    }

    const collection = database.collection('tournaments');
    await collection.insertOne({
      date: sanitize(req.body.date),
      round: sanitize(req.body.round),
      buyin: sanitize(req.body.buyin),
      rebuys: rebuys,
      prizes: prizes,
      players: players
    });
  } catch (e) {
    console.error(e);
  } finally {
    console.log('closing db...');
    //Ensures that the client will close when you finish/error
    await client.close();
  }
}

export default async (req, res) => {
  //write data to database
  await run(req);

  res.status(200).send({ message: "Tournament inserted" });
}

import client from './db.js';
import { ObjectId } from 'mongodb';

const getTournaments = async (tournaments, req) => {
  console.log(req.query);
  const seasonId =  req.query.season_id;
  const id = req.query.tournament_id;
  const query = (seasonId) ? {'season_id': seasonId} : {};

  if (id) {
    return await tournaments.findOne({
      _id: new ObjectId(id)
    });
  } else {
    return await tournaments.find(query).toArray();
  }
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db('pokerrangliste');
    const tournaments = database.collection('tournaments');
    const seasons = database.collection('seasons');
    const data = {
      seasons: await seasons.find().toArray(),
      tournaments: await getTournaments(tournaments, req)
    };
    res.json(data);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

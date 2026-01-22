import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import {
  fetchAllSeasons,
  editSeasonName,
  addNewSeason,
  userOwnsLeague
} from './_utils.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('seasons');

    if (req.method === 'GET') {
      const league_id = req.query.league_id;
      const docs = await collection.find({league_id}).sort({'name': -1}).toArray()
      res.json(docs);
    }

    if (req.method === 'POST') {
      const league_id = req.body.league_id;
      const leagues = database.collection('leagues');
      if (!await userOwnsLeague(league_id, req.cookies.jwt, leagues)) {
        throw new Error('Either league id is not valid or Logged-in user is not owner of the league');
      }
      const name = req.body.name;
      const seasonId = req.body.season_id;
      const doc = await collection.findOne({league_id, name});

      if (doc) {
        throw new Error(`Name ${name} is already taken`);
      }

      if (seasonId) {
        await editSeasonName(name, seasonId, collection, league_id);
      } else {
        await addNewSeason(name, collection, league_id);
      }

      // return all seasons so state in app can be updated from response
      const seasons = await fetchAllSeasons(collection, league_id);
      res.json({
        data: { seasons }
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}

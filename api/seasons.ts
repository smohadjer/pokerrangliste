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
      return res.json(docs);
    }

    // edits an existing season or adds a new season
    if (req.method === 'POST') {
      const league_id = req.body.league_id;
      const leagues = database.collection('leagues');

      if (!await userOwnsLeague(league_id, req, leagues)) {
        throw new Error('Either league id is not valid or Logged-in user is not owner of the league');
      }

      // validate season name
      const name = req.body.name;
      if (!name) {
        throw new Error(`a name for season is required`);
      }
      const doc = await collection.findOne({league_id, name});
      if (doc) {
        throw new Error(`Name ${name} is already taken`);
      }

      const seasonId = req.body.season_id;
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

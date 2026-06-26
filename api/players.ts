import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import {
  fetchAllPlayers,
  editPlayerName,
  addNewPlayer,
  userOwnsLeague,
  sanitize,
  findNameConflict,
} from './_utils.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('players');

    if (req.method === 'GET') {
      const league_id = req.query.league_id;
      const id = req.query?.id;
      const name = req.query?.name;
      if (id || name) {
        const query = id ? {
          league_id,
          _id: new ObjectId(id)
        } : {
          league_id,
          name: name
        };
        const doc = await collection.findOne(query);
        if (doc) {
          delete doc.photo_content_type;
          delete doc.photo_data_base64;
          res.json(doc);
        } else {
          res.status(404).end();
        }
      } else {
        const docs = await fetchAllPlayers(collection, league_id);
        res.json(docs);
      }
    }

    if (req.method === 'POST') {
      const league_id = req.body.league_id;
      const leagues = database.collection('leagues');
      if (!await userOwnsLeague(league_id, req, leagues)) {
        throw new Error('Either league id is not valid or Logged-in user is not owner of the league');
      }

      const playerId = req.body.player_id;
      const name = sanitize(req.body.name);
      const hasNameUpdate = typeof name === 'string' && name.length > 0;
      const hasPhotoUpdate = typeof req.body.photo_data_url === 'string' && req.body.photo_data_url.length > 0;

      if (!playerId && !hasNameUpdate) {
        throw new Error('This field is required');
      }

      if (playerId) {
        if (!hasNameUpdate && !hasPhotoUpdate) {
          throw new Error('Please provide a new name or upload a profile photo');
        }

        if (hasNameUpdate) {
          const doc = await findNameConflict(collection, { league_id }, name, playerId);
          if (doc) {
            throw new Error(`Name ${name} is already taken`);
          }
          await editPlayerName(name, playerId, collection, league_id);
        }

        if (hasPhotoUpdate) {
          await savePlayerPhoto(collection, league_id, req.body.photo_data_url, playerId);
        }
      } else {
        const doc = await findNameConflict(collection, { league_id }, name);
        if (doc) {
          throw new Error(`Name ${name} is already taken`);
        }
        const response = await addNewPlayer(name, collection, league_id);
        if (hasPhotoUpdate) {
          await savePlayerPhoto(
            collection,
            league_id,
            req.body.photo_data_url,
            response.insertedId.toString()
          );
        }
      }

      // return all players so state in app can be updated from response
      const players = await fetchAllPlayers(collection, league_id);
      res.json({
        data: { players }
      });
    }

    if (req.method === 'DELETE') {
      const name = req.query.name;
      const id = req.query.id

      console.log(name, id);

      const result = await collection.deleteOne( { name: req.query.name });
      console.log(result);
      if (result.deletedCount > 0) {
        res.end();
      } else {
        res.json({'Error': 'Delete failed!'});
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}

async function savePlayerPhoto(collection, league_id: string, photoDataUrl: string, playerId: string) {
  const matches = photoDataUrl.match(/^data:(image\/png);base64,(.+)$/);
  const maxPhotoSizeBytes = 1 * 1024 * 1024;
  if (!matches) {
    throw new Error('Uploaded player photo must be a PNG image');
  }

  const imageSizeBytes = Buffer.byteLength(matches[2], 'base64');
  if (imageSizeBytes > maxPhotoSizeBytes) {
    throw new Error('Uploaded player photo must be smaller than 1 MB');
  }

  const response = await collection.updateOne(
    { league_id, _id: ObjectId.createFromHexString(playerId) },
    {
      $set: {
        photo_content_type: matches[1],
        photo_data_base64: matches[2],
        photo_updated_at: new Date().toISOString(),
      }
    }
  );

  console.log(response);
}

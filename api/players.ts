import { MongoClient, ObjectId } from 'mongodb';
import { Jimp } from 'jimp';
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
      let savedPhotoBytes: number | undefined;
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
          savedPhotoBytes = await savePlayerPhoto(collection, league_id, req.body.photo_data_url, playerId);
        }
      } else {
        const doc = await findNameConflict(collection, { league_id }, name);
        if (doc) {
          throw new Error(`Name ${name} is already taken`);
        }
        const response = await addNewPlayer(name, collection, league_id);
        if (hasPhotoUpdate) {
          savedPhotoBytes = await savePlayerPhoto(
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
        data: {
          players,
          photo_saved_bytes: savedPhotoBytes,
        }
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
  const maxStoredPhotoSizeBytes = 100 * 1024;
  if (!matches) {
    throw new Error('Uploaded player photo must be a PNG image');
  }

  const optimizedPhoto = await optimizePlayerPhoto(matches[2], maxStoredPhotoSizeBytes);

  const response = await collection.updateOne(
    { league_id, _id: ObjectId.createFromHexString(playerId) },
    {
      $set: {
        photo_content_type: optimizedPhoto.contentType,
        photo_data_base64: optimizedPhoto.dataBase64,
        photo_updated_at: new Date().toISOString(),
      }
    }
  );

  console.log(response);
  return optimizedPhoto.bytes;
}

async function optimizePlayerPhoto(photoBase64: string, maxPhotoSizeBytes: number) {
  const sourceBuffer = Buffer.from(photoBase64, 'base64');
  let image = await Jimp.read(sourceBuffer);
  let width = Math.min(image.bitmap.width, 192);
  let height = Math.min(image.bitmap.height, 192);
  image = image.cover({ w: width, h: height });
  let quality = 76;
  let outputBuffer = await image.getBuffer('image/jpeg', { quality });

  while (outputBuffer.length > maxPhotoSizeBytes && (width > 96 || height > 96 || quality > 36)) {
    if (outputBuffer.length > maxPhotoSizeBytes && quality > 40) {
      quality -= 7;
    }

    if (outputBuffer.length > maxPhotoSizeBytes && (width > 96 || height > 96)) {
      width = Math.max(96, Math.floor(width * 0.85));
      height = Math.max(96, Math.floor(height * 0.85));
      image = image.clone().cover({ w: width, h: height });
    }

    outputBuffer = await image.getBuffer('image/jpeg', { quality });
  }

  if (outputBuffer.length > maxPhotoSizeBytes) {
    throw new Error('Uploaded player photo could not be reduced below 100 KB');
  }

  return {
    contentType: 'image/jpeg',
    dataBase64: outputBuffer.toString('base64'),
    bytes: outputBuffer.length,
  };
}

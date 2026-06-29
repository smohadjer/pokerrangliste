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
    const leagues = database.collection('leagues');
    const tournaments = database.collection('tournaments');

    if (req.method === 'GET') {
      const league_id = req.query.league_id;
      const league = typeof league_id === 'string'
        ? await leagues.findOne({ _id: ObjectId.createFromHexString(league_id) })
        : null;
      const tenant_id = league?.tenant_id;
      const id = req.query?.id;
      const name = req.query?.name;
      if (!tenant_id) {
        throw new Error('Valid league_id is required');
      }

      if (id || name) {
        const query = id ? {
          tenant_id,
          _id: new ObjectId(id),
          deleted_at: { $exists: false }
        } : {
          tenant_id,
          name: name,
          deleted_at: { $exists: false }
        };
        const doc = await collection.findOne(query, { collation: { locale: 'en', strength: 2 } });
        if (doc) {
          delete doc.photo_content_type;
          delete doc.photo_data_base64;
          res.json(doc);
        } else {
          res.status(404).end();
        }
      } else {
        const docs = await fetchAllPlayers(collection, tenant_id);
        res.json(docs);
      }
    }

    if (req.method === 'POST') {
      const league_id = req.body.league_id;
      let savedPhotoBytes: number | undefined;
      if (!await userOwnsLeague(league_id, req, leagues)) {
        throw new Error('Either league id is not valid or Logged-in user is not owner of the league');
      }
      const league = await leagues.findOne({ _id: ObjectId.createFromHexString(league_id) });
      const tenant_id = league?.tenant_id;
      if (!tenant_id) {
        throw new Error('League is missing tenant_id');
      }

      const playerId = req.body.player_id;
      const formAction = req.body.form_action;
      const name = sanitize(req.body.name);
      const hasNameUpdate = typeof name === 'string' && name.length > 0;
      const hasPhotoUpdate = typeof req.body.photo_data_url === 'string' && req.body.photo_data_url.length > 0;

      if (formAction === 'delete') {
        if (!playerId || !ObjectId.isValid(playerId)) {
          throw new Error('Valid player_id is required');
        }

        const playerObjectId = ObjectId.createFromHexString(playerId);
        const player = await collection.findOne({
          _id: playerObjectId,
          tenant_id,
          deleted_at: { $exists: false }
        });
        if (!player) {
          return res.status(404).json({ error: 'Player not found' });
        }

        const existingReferences = await tournaments.countDocuments({
          $or: [
            { players: { $elemMatch: { id: playerId } } },
            { bounties: { $elemMatch: { id: playerId } } }
          ]
        });
        if (existingReferences > 0) {
          return res.status(409).json({
            error: 'Only players who have never played in a tournament can be deleted.'
          });
        }

        const result = await collection.updateOne(
          {
            _id: playerObjectId,
            tenant_id,
            deleted_at: { $exists: false }
          },
          {
            $set: {
              deleted_at: new Date().toISOString()
            }
          }
        );

        if (result.modifiedCount === 0) {
          throw new Error('Delete failed!');
        }

        const players = await fetchAllPlayers(collection, tenant_id);
        return res.json({
          data: {
            players
          }
        });
      }

      if (!playerId && !hasNameUpdate) {
        throw new Error('This field is required');
      }

      if (playerId) {
        if (!hasNameUpdate && !hasPhotoUpdate) {
          throw new Error('Please provide a new name or upload a profile photo');
        }

        if (hasNameUpdate) {
          const doc = await findNameConflict(collection, { tenant_id }, name, playerId);
          if (doc) {
            throw new Error(`Name ${name} is already taken`);
          }
          await editPlayerName(name, playerId, collection, tenant_id);
        }

        if (hasPhotoUpdate) {
          savedPhotoBytes = await savePlayerPhoto(
            collection,
            tenant_id,
            req.body.photo_data_url,
            playerId
          );
        }
      } else {
        const doc = await findNameConflict(collection, { tenant_id }, name);
        if (doc) {
          throw new Error(`Name ${name} is already taken`);
        }
        const response = await addNewPlayer(name, collection, league_id, tenant_id);
        if (hasPhotoUpdate) {
          savedPhotoBytes = await savePlayerPhoto(
            collection,
            tenant_id,
            req.body.photo_data_url,
            response.insertedId.toString()
          );
        }
      }

      // return all players so state in app can be updated from response
      const players = await fetchAllPlayers(collection, tenant_id);
      res.json({
        data: {
          players,
          photo_saved_bytes: savedPhotoBytes,
        }
      });
    }

  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}

async function savePlayerPhoto(
  collection,
  tenant_id: string,
  photoDataUrl: string,
  playerId: string
) {
  const matches = photoDataUrl.match(/^data:(image\/png);base64,(.+)$/);
  const maxStoredPhotoSizeBytes = 100 * 1024;
  if (!matches) {
    throw new Error('Uploaded player photo must be a PNG image');
  }

  const optimizedPhoto = await optimizePlayerPhoto(matches[2], maxStoredPhotoSizeBytes);

  const response = await collection.updateOne(
    {
      _id: ObjectId.createFromHexString(playerId),
      tenant_id
    },
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

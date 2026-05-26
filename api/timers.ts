import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { getJwtPayload } from './verifyAuth.js';

const client = new MongoClient(database_uri);

const defaultTimerSettings = {
  duration: 15 * 60,
  small_blinds: [5, 10, 20, 40, 80, 150, 300]
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('timers');
    const leagues = database.collection('leagues');

    if (req.method === 'GET') {
      const league_id = req.query.league_id;
      if (!league_id) {
        throw new Error('No league ID provided');
      }

      const league = await leagues.findOne({
        _id: ObjectId.createFromHexString(league_id)
      });
      const timers = await collection.find(getTimersQuery(league)).toArray();
      return res.json(timers);
    }

    if (req.method === 'POST') {
      const payload = await getJwtPayload(req);
      const tenant_id = payload?.id;
      if (!tenant_id) {
        throw new Error('No tenant found');
      }

      const timerId = req.body.timer_id;

      if (req.body.form_action === 'delete') {
        if (!timerId) {
          throw new Error('No timer ID provided');
        }

        const result = await collection.deleteOne({
          _id: ObjectId.createFromHexString(timerId),
          tenant_id
        });

        if (result.deletedCount === 0) {
          throw new Error('Failed to delete timer');
        }

        await leagues.updateMany(
          {
            tenant_id,
            default_timer_id: timerId
          },
          {
            $unset: {
              default_timer_id: ''
            }
          }
        );
      } else if (timerId) {
        const timerSettings = createTimerSettingsDocument(req.body);
        await collection.updateOne(
          {
            _id: ObjectId.createFromHexString(timerId),
            tenant_id
          },
          {
            $set: {
              ...timerSettings,
              tenant_id
            }
          }
        );
      } else {
        const timerSettings = createTimerSettingsDocument(req.body);
        await collection.insertOne({
          ...timerSettings,
          tenant_id
        });
      }

      const timers = await collection.find({ tenant_id }).toArray();
      return res.json({
        data: {
          timers,
          leagues: await leagues.find({ tenant_id }).toArray()
        }
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  } finally {
    await client.close();
  }
}

function createTimerSettingsDocument(body) {
  return {
    name: body.name,
    duration: getPositiveNumber(body.duration, defaultTimerSettings.duration),
    small_blinds: getSmallBlinds(body.small_blinds)
  };
}

function getPositiveNumber(value, fallback: number) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function getSmallBlinds(value) {
  const values = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const smallBlinds = values
    .map(item => Number(String(item).trim()))
    .filter(item => Number.isFinite(item) && item > 0);

  return smallBlinds.length > 0 ? smallBlinds : defaultTimerSettings.small_blinds;
}

function getTimersQuery(league) {
  return league?.tenant_id
    ? { tenant_id: league.tenant_id }
    : { _id: undefined };
}

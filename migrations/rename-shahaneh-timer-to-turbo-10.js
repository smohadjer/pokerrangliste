import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const databaseName = 'turnies';
const databaseUri = process.env.db_uri;
const leagueId = '677a4f585462214b2a1ac77e';
const oldName = 'Shahaneh';
const newName = 'Turbo_10';

if (!databaseUri) {
  console.error('Missing db_uri in .env');
  process.exit(1);
}

const client = new MongoClient(databaseUri);

try {
  await client.connect();

  const database = client.db(databaseName);
  const leagues = database.collection('leagues');
  const timers = database.collection('timers');

  const league = await leagues.findOne({
    _id: ObjectId.createFromHexString(leagueId)
  });

  if (!league?.tenant_id) {
    throw new Error(`League not found or missing tenant_id: ${leagueId}`);
  }

  const result = await timers.updateOne(
    {
      tenant_id: league.tenant_id,
      name: oldName
    },
    {
      $set: {
        name: newName
      }
    }
  );

  console.log(`Matched ${result.matchedCount} timer(s).`);
  console.log(`Modified ${result.modifiedCount} timer(s).`);

  if (result.matchedCount === 0) {
    console.warn(`No timer named "${oldName}" found for league ${leagueId}.`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.close();
}

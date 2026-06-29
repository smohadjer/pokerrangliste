import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config({ quiet: true });

const DEFAULT_DATABASE_NAME = process.env.db_name || 'turnies';
const DEFAULT_TARGET_LEAGUE_ID = '69792ccf01f9d349c29f6e84';

function printUsage() {
  console.log(`Usage: npm run restore:tournaments:backup -- [options]

Options:
  --apply            Apply the restore. Default is dry-run.
  --db <name>        Database name (default: ${DEFAULT_DATABASE_NAME})
  --backup <file>    Backup tournaments JSON file. Defaults to the latest backups/export_*/turnies.tournaments.json
  --league <id>      Only restore tournaments for this league (default: ${DEFAULT_TARGET_LEAGUE_ID})
  --help             Show this help message

Environment:
  db_uri             MongoDB connection string (required)
  db_name            Optional database name override
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    dbName: DEFAULT_DATABASE_NAME,
    backupFile: '',
    targetLeagueId: DEFAULT_TARGET_LEAGUE_ID,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--apply') {
      options.apply = true;
      continue;
    }

    if (arg === '--db') {
      options.dbName = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--backup') {
      options.backupFile = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === '--league') {
      options.targetLeagueId = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getDatabaseUri() {
  if (!process.env.db_uri) {
    throw new Error('Missing db_uri in environment. Add db_uri to your .env file.');
  }

  return process.env.db_uri;
}

function getObjectIdString(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof ObjectId) {
    return value.toString();
  }
  if (typeof value === 'object' && typeof value.toHexString === 'function') {
    return value.toHexString();
  }
  if (typeof value === 'object' && '$oid' in value) {
    return String(value.$oid);
  }
  return String(value);
}

async function findLatestBackupFile(dbName) {
  const backupsDir = path.join(process.cwd(), 'backups');
  const entries = await fs.readdir(backupsDir, { withFileTypes: true });
  const exportDirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('export_'))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  for (const dirName of exportDirs) {
    const candidate = path.join(backupsDir, dirName, `${dbName}.tournaments.json`);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  throw new Error(`Could not find a backup tournaments file under ${backupsDir}`);
}

async function loadBackupTournaments(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Backup file does not contain a JSON array: ${filePath}`);
  }

  return parsed.map((tournament) => ({
    ...tournament,
    _id: getObjectIdString(tournament._id),
  }));
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const backupFile = options.backupFile || await findLatestBackupFile(options.dbName);
  const client = new MongoClient(getDatabaseUri());

  try {
    const backupTournaments = await loadBackupTournaments(backupFile);
    const backupById = new Map(
      backupTournaments
        .filter((tournament) => tournament.league_id === options.targetLeagueId)
        .map((tournament) => [tournament._id, tournament])
    );

    await client.connect();

    const database = client.db(options.dbName);
    const tournamentsCollection = database.collection('tournaments');
    const currentTournaments = await tournamentsCollection.find({ league_id: options.targetLeagueId }).toArray();

    const plans = currentTournaments
      .map((tournament) => {
        const id = tournament._id.toString();
        const backup = backupById.get(id);
        if (!backup) {
          return null;
        }

        const missingFields = ['season_id', 'date', 'status', 'buyin'].filter((field) => tournament[field] === undefined);
        if (missingFields.length === 0) {
          return null;
        }

        return {
          tournamentId: id,
          missingFields,
          restore: {
            season_id: backup.season_id ?? '',
            date: backup.date ?? '',
            status: backup.status ?? '',
            buyin: backup.buyin ?? 0,
          }
        };
      })
      .filter(Boolean);

    console.log(JSON.stringify({
      mode: options.apply ? 'apply' : 'dry-run',
      database: options.dbName,
      backupFile,
      targetLeagueId: options.targetLeagueId,
      currentTournaments: currentTournaments.length,
      tournamentsNeedingRestore: plans.length,
    }, null, 2));

    if (plans.length > 0) {
      console.log('Restore plan:');
      for (const plan of plans) {
        console.log(JSON.stringify(plan, null, 2));
      }
    }

    if (!options.apply) {
      console.log('Dry-run only. Re-run with --apply to restore tournament fields from backup.');
      return;
    }

    for (const plan of plans) {
      await tournamentsCollection.updateOne(
        { _id: ObjectId.createFromHexString(plan.tournamentId) },
        { $set: plan.restore }
      );
    }

    console.log(`Restored fields for ${plans.length} tournament(s).`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

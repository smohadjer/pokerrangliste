import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config({ quiet: true });

const DEFAULT_DATABASE_NAME = process.env.db_name || 'turnies';
const DEFAULT_TARGET_LEAGUE_ID = '69792ccf01f9d349c29f6e84';

function printUsage() {
  console.log(`Usage: npm run repair:players:refs -- [options]

Options:
  --apply            Apply the remap. Default is dry-run.
  --db <name>        Database name (default: ${DEFAULT_DATABASE_NAME})
  --backup <file>    Backup players JSON file. Defaults to the latest backups/export_*/turnies.players.json
  --league <id>      Only repair tournaments for this league (default: ${DEFAULT_TARGET_LEAGUE_ID})
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

function normalizeName(name) {
  return String(name ?? '').trim().toLocaleLowerCase('en');
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

  if (typeof value === 'object' && value._bsontype === 'ObjectId' && typeof value.toString === 'function') {
    return value.toString();
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
    const candidate = path.join(backupsDir, dirName, `${dbName}.players.json`);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  throw new Error(`Could not find a backup players file under ${backupsDir}`);
}

async function loadBackupPlayers(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Backup file does not contain a JSON array: ${filePath}`);
  }

  return parsed.map((player) => ({
    ...player,
    _id: getObjectIdString(player._id),
    league_id: player.league_id ?? '',
  }));
}

function buildLeagueMap(leagues) {
  return new Map(leagues.map((league) => [league._id.toString(), league]));
}

function buildCurrentPlayersById(players) {
  return new Map(players.map((player) => [player._id.toString(), player]));
}

function buildCurrentPlayersByTenantAndName(players) {
  const map = new Map();

  for (const player of players) {
    const tenantId = player.tenant_id ?? '';
    const key = `${tenantId}::${normalizeName(player.name)}`;
    const list = map.get(key) ?? [];
    list.push(player);
    map.set(key, list);
  }

  return map;
}

function collectTournamentPlayerIds(tournaments) {
  const ids = new Set();

  const addIds = (items) => {
    for (const item of items ?? []) {
      if (item?.id) {
        ids.add(getObjectIdString(item.id));
      }
    }
  };

  for (const tournament of tournaments) {
    addIds(tournament.players);
    addIds(tournament.bounties);
  }

  return ids;
}

function rewriteTournamentPlayerIds(tournament, replacementMap) {
  let changed = false;

  const rewriteItems = (items) => {
    if (!Array.isArray(items)) {
      return items;
    }

    return items.map((item) => {
      const currentId = item?.id ? getObjectIdString(item.id) : '';
      const nextId = replacementMap.get(currentId);
      if (!nextId || nextId === currentId) {
        return item;
      }

      changed = true;
      return {
        ...item,
        id: nextId,
      };
    });
  };

  const replacement = {
    ...tournament,
    players: rewriteItems(tournament.players),
    bounties: rewriteItems(tournament.bounties),
  };

  return {
    changed,
    replacement,
  };
}

function countReplacementMatches(tournaments, replacementMap) {
  let matches = 0;

  const countItems = (items) => {
    for (const item of items ?? []) {
      const currentId = item?.id ? getObjectIdString(item.id) : '';
      if (currentId && replacementMap.has(currentId)) {
        matches += 1;
      }
    }
  };

  for (const tournament of tournaments) {
    countItems(tournament.players);
    countItems(tournament.bounties);
  }

  return matches;
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
    const backupPlayers = await loadBackupPlayers(backupFile);
    const backupPlayersById = new Map(backupPlayers.map((player) => [player._id, player]));

    await client.connect();

    const database = client.db(options.dbName);
    const playersCollection = database.collection('players');
    const leaguesCollection = database.collection('leagues');
    const tournamentsCollection = database.collection('tournaments');

    const [currentPlayers, leagues, tournaments] = await Promise.all([
      playersCollection.find({}).toArray(),
      leaguesCollection.find({}, { projection: { tenant_id: 1 } }).toArray(),
      tournamentsCollection.find({}).toArray(),
    ]);

    const leagueMap = buildLeagueMap(leagues);
    const currentPlayersById = buildCurrentPlayersById(currentPlayers);
    const currentPlayersByTenantAndName = buildCurrentPlayersByTenantAndName(currentPlayers);
    const targetTournaments = tournaments.filter(
      (tournament) => tournament.league_id === options.targetLeagueId
    );
    const referencedIds = collectTournamentPlayerIds(targetTournaments);

    const missingReferencedIds = [...referencedIds]
      .filter((id) => !currentPlayersById.has(id))
      .sort((left, right) => left.localeCompare(right));

    const remapPlans = [];
    const unresolved = [];

    for (const missingId of missingReferencedIds) {
      const backupPlayer = backupPlayersById.get(missingId);
      if (!backupPlayer) {
        unresolved.push({
          missingPlayerId: missingId,
          reason: 'missing-from-backup',
        });
        continue;
      }

      const tenantId = leagueMap.get(backupPlayer.league_id)?.tenant_id;
      if (!tenantId) {
        unresolved.push({
          missingPlayerId: missingId,
          playerName: backupPlayer.name,
          league_id: backupPlayer.league_id,
          reason: 'tenant-not-resolved',
        });
        continue;
      }

      const key = `${tenantId}::${normalizeName(backupPlayer.name)}`;
      const candidates = currentPlayersByTenantAndName.get(key) ?? [];

      if (candidates.length === 0) {
        unresolved.push({
          missingPlayerId: missingId,
          playerName: backupPlayer.name,
          tenant_id: tenantId,
          reason: 'no-current-player-with-same-name',
        });
        continue;
      }

      if (candidates.length > 1) {
        unresolved.push({
          missingPlayerId: missingId,
          playerName: backupPlayer.name,
          tenant_id: tenantId,
          reason: 'multiple-current-players-with-same-name',
          candidateIds: candidates.map((candidate) => candidate._id.toString()),
        });
        continue;
      }

      remapPlans.push({
        missingPlayerId: missingId,
        playerName: backupPlayer.name,
        tenant_id: tenantId,
        currentPlayerId: candidates[0]._id.toString(),
        currentLeagueId: candidates[0].league_id ?? null,
      });
    }

    const replacementMap = new Map(
      remapPlans.map((plan) => [plan.missingPlayerId, plan.currentPlayerId])
    );
    const replacementMatches = countReplacementMatches(targetTournaments, replacementMap);

    const tournamentUpdates = targetTournaments
      .map((tournament) => ({
        tournamentId: tournament._id.toString(),
        ...rewriteTournamentPlayerIds(tournament, replacementMap),
      }))
      .filter((update) => update.changed);

    console.log(JSON.stringify({
      mode: options.apply ? 'apply' : 'dry-run',
      database: options.dbName,
      backupFile,
      targetLeagueId: options.targetLeagueId,
      totalCurrentPlayers: currentPlayers.length,
      referencedPlayerIds: referencedIds.size,
      missingReferencedPlayerIds: missingReferencedIds.length,
      remapPlans: remapPlans.length,
      unresolved: unresolved.length,
      replacementMatches,
      tournamentsScanned: targetTournaments.length,
      tournamentsToRewrite: tournamentUpdates.length,
      sampleReferencedPlayerIds: [...referencedIds].slice(0, 5),
      sampleReplacementKeys: [...replacementMap.keys()].slice(0, 5),
    }, null, 2));

    if (remapPlans.length > 0) {
      console.log('Remap plan:');
      for (const plan of remapPlans) {
        console.log(JSON.stringify(plan, null, 2));
      }
    }

    if (unresolved.length > 0) {
      console.log('Unresolved references:');
      for (const item of unresolved) {
        console.log(JSON.stringify(item, null, 2));
      }
    }

    if (!options.apply) {
      console.log('Dry-run only. Re-run with --apply to rewrite tournament player references.');
      return;
    }

    if (unresolved.length > 0) {
      throw new Error('Refusing to apply while unresolved player references remain.');
    }

    for (const tournamentUpdate of tournamentUpdates) {
      await tournamentsCollection.updateOne(
        { _id: tournamentUpdate.replacement._id },
        {
          $set: {
            players: tournamentUpdate.replacement.players,
            bounties: tournamentUpdate.replacement.bounties ?? null,
          }
        }
      );
    }

    console.log(`Rewrote ${tournamentUpdates.length} tournament document(s).`);
    console.log(`Remapped ${remapPlans.length} missing player reference(s).`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

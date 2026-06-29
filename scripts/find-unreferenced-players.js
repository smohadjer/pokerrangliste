import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ quiet: true });

const DEFAULT_DATABASE_NAME = process.env.db_name || 'turnies';

function printUsage() {
  console.log(`Usage: npm run find:players:unreferenced -- [options]

Options:
  --apply            Delete the unreferenced players
  --db <name>       Database name (default: ${DEFAULT_DATABASE_NAME})
  --json            Output only the unreferenced players as JSON
  --help            Show this help message

Environment:
  db_uri            MongoDB connection string (required)
  db_name           Optional database name override
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    dbName: DEFAULT_DATABASE_NAME,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
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

function buildLeagueMap(leagues) {
  return new Map(leagues.map((league) => [league._id.toString(), league]));
}

function resolveTenantId(player, leagueMap) {
  if (player.tenant_id) {
    return player.tenant_id;
  }

  if (!player.league_id) {
    return null;
  }

  return leagueMap.get(player.league_id)?.tenant_id ?? null;
}

function buildReferencedPlayerIds(tournaments) {
  const referencedIds = new Set();

  const addIds = (items) => {
    for (const item of items ?? []) {
      if (item?.id) {
        referencedIds.add(String(item.id));
      }
    }
  };

  for (const tournament of tournaments) {
    addIds(tournament.players);
    addIds(tournament.bounties);
  }

  return referencedIds;
}

function summarizePlayer(player) {
  return {
    id: player._id.toString(),
    name: player.name,
    tenant_id: player.tenant_id ?? null,
    league_id: player.league_id ?? null,
    legacy_league_ids: player.legacy_league_ids ?? [],
    hasPhoto: Boolean(player.photo_content_type && player.photo_data_base64),
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const client = new MongoClient(getDatabaseUri());

  try {
    await client.connect();

    const database = client.db(options.dbName);
    const playersCollection = database.collection('players');
    const leaguesCollection = database.collection('leagues');
    const tournamentsCollection = database.collection('tournaments');

    const [players, leagues, tournaments] = await Promise.all([
      playersCollection.find({}).toArray(),
      leaguesCollection.find({}, { projection: { tenant_id: 1 } }).toArray(),
      tournamentsCollection.find({}, { projection: { players: 1, bounties: 1 } }).toArray(),
    ]);

    const leagueMap = buildLeagueMap(leagues);
    const referencedPlayerIds = buildReferencedPlayerIds(tournaments);
    const playersWithTenant = players.map((player) => ({
      ...player,
      tenant_id: resolveTenantId(player, leagueMap),
    }));

    const unreferencedPlayers = playersWithTenant
      .filter((player) => !referencedPlayerIds.has(player._id.toString()))
      .sort((left, right) => {
        const tenantCompare = String(left.tenant_id ?? '').localeCompare(String(right.tenant_id ?? ''));
        if (tenantCompare !== 0) {
          return tenantCompare;
        }

        return String(left.name ?? '').localeCompare(String(right.name ?? ''), 'en', {
          sensitivity: 'base',
        });
      })
      .map(summarizePlayer);

    if (options.json) {
      console.log(JSON.stringify(unreferencedPlayers, null, 2));
      return;
    }

    console.log(JSON.stringify({
      database: options.dbName,
      totalPlayers: players.length,
      referencedPlayers: referencedPlayerIds.size,
      unreferencedPlayers: unreferencedPlayers.length,
    }, null, 2));

    if (unreferencedPlayers.length === 0) {
      console.log('No unreferenced players found.');
      return;
    }

    console.log('Unreferenced players:');
    for (const player of unreferencedPlayers) {
      console.log(JSON.stringify(player, null, 2));
    }

    if (!options.apply) {
      console.log('Dry-run only. Re-run with --apply to delete these players.');
      return;
    }

    const idsToDelete = unreferencedPlayers.map((player) => player.id);
    const result = await playersCollection.deleteMany({
      _id: {
        $in: idsToDelete.map((id) => players.find((player) => player._id.toString() === id)._id)
      }
    });

    console.log(`Deleted ${result.deletedCount} unreferenced player(s).`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

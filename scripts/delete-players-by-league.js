import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ quiet: true });

const DEFAULT_DATABASE_NAME = process.env.db_name || 'turnies';
const DEFAULT_LEAGUE_ID = '678029b8571a2ed982ce12e4';

function printUsage() {
  console.log(`Usage: npm run delete:players:league -- [options]

Options:
  --apply            Delete the matching players. Default is dry-run.
  --db <name>        Database name (default: ${DEFAULT_DATABASE_NAME})
  --league <id>      Delete players with this league_id (default: ${DEFAULT_LEAGUE_ID})
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
    leagueId: DEFAULT_LEAGUE_ID,
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

    if (arg === '--league') {
      options.leagueId = argv[index + 1];
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
    const tournamentsCollection = database.collection('tournaments');

    const players = await playersCollection.find({ league_id: options.leagueId }).toArray();
    const playerIds = new Set(players.map((player) => player._id.toString()));

    const tournaments = await tournamentsCollection.find({}, { projection: { players: 1, bounties: 1 } }).toArray();
    const referencedPlayerIds = new Set();
    const referencedPlayers = [];

    for (const tournament of tournaments) {
      const playerRefs = [...(tournament.players ?? []), ...(tournament.bounties ?? [])];
      for (const ref of playerRefs) {
        const id = ref?.id ? String(ref.id) : '';
        if (playerIds.has(id)) {
          referencedPlayerIds.add(id);
          referencedPlayers.push({
            tournamentId: tournament._id.toString(),
            playerId: id,
          });
        }
      }
    }

    const referencedLeaguePlayers = players.filter((player) => referencedPlayerIds.has(player._id.toString()));
    const unreferencedLeaguePlayers = players.filter((player) => !referencedPlayerIds.has(player._id.toString()));

    console.log(JSON.stringify({
      mode: options.apply ? 'apply' : 'dry-run',
      database: options.dbName,
      leagueId: options.leagueId,
      playersFound: players.length,
      referencedPlayers: referencedLeaguePlayers.length,
      unreferencedPlayers: unreferencedLeaguePlayers.length,
      referencedMatches: referencedPlayers.length,
    }, null, 2));

    if (unreferencedLeaguePlayers.length > 0) {
      console.log('Unreferenced players eligible for deletion:');
      for (const player of unreferencedLeaguePlayers) {
        console.log(JSON.stringify({
          id: player._id.toString(),
          name: player.name,
          league_id: player.league_id ?? null,
          tenant_id: player.tenant_id ?? null,
        }, null, 2));
      }
    }

    if (referencedLeaguePlayers.length > 0) {
      console.log('Referenced players kept:');
      for (const player of referencedLeaguePlayers) {
        console.log(JSON.stringify({
          id: player._id.toString(),
          name: player.name,
          league_id: player.league_id ?? null,
          tenant_id: player.tenant_id ?? null,
        }, null, 2));
      }
    }

    if (referencedPlayers.length > 0) {
      console.log('Tournament references:');
      for (const item of referencedPlayers) {
        console.log(JSON.stringify(item, null, 2));
      }
    }

    if (players.length === 0) {
      console.log('No players found for that league_id.');
      return;
    }

    if (unreferencedLeaguePlayers.length === 0) {
      console.log('No unreferenced players found for deletion.');
      return;
    }

    if (!options.apply) {
      console.log('Dry-run only. Re-run with --apply to delete the unreferenced players listed above.');
      return;
    }

    const result = await playersCollection.deleteMany({
      _id: {
        $in: unreferencedLeaguePlayers.map((player) => player._id)
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

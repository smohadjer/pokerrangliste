import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config({ quiet: true });

const DEFAULT_DATABASE_NAME = process.env.db_name || 'turnies';
const DEFAULT_PREFERRED_LEAGUE_ID = '677cc26c5462214b2a1ac7a0';

function printUsage() {
  console.log(`Usage: npm run migrate:players:dedupe -- [options]

Options:
  --apply                     Apply changes. Default is dry-run.
  --db <name>                 Database name (default: ${DEFAULT_DATABASE_NAME})
  --preferred-league <id>     Prefer this league_id when picking canonical players
  --help                      Show this help message

Environment:
  db_uri                      MongoDB connection string (required)
  db_name                     Optional database name override
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    dbName: DEFAULT_DATABASE_NAME,
    preferredLeagueId: DEFAULT_PREFERRED_LEAGUE_ID,
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

    if (arg === '--preferred-league') {
      options.preferredLeagueId = argv[index + 1];
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

function getPlayerId(player) {
  return player._id.toString();
}

function getPlayerSummary(player) {
  return {
    id: getPlayerId(player),
    name: player.name,
    tenant_id: player.tenant_id ?? null,
    league_id: player.league_id ?? null,
    hasPhoto: Boolean(player.photo_content_type && player.photo_data_base64),
  };
}

function buildLeagueMap(leagues) {
  return new Map(leagues.map((league) => [league._id.toString(), league]));
}

function buildReferenceCounts(tournaments) {
  const referenceCounts = new Map();

  const increment = (playerId) => {
    if (!playerId) {
      return;
    }

    const key = getObjectIdString(playerId);
    referenceCounts.set(key, (referenceCounts.get(key) ?? 0) + 1);
  };

  for (const tournament of tournaments) {
    for (const player of tournament.players ?? []) {
      increment(player.id);
    }

    for (const bounty of tournament.bounties ?? []) {
      increment(bounty.id);
    }
  }

  return referenceCounts;
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

function compareObjectIdsAscending(left, right) {
  const leftTime = left._id.getTimestamp().getTime();
  const rightTime = right._id.getTimestamp().getTime();

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left._id.toString().localeCompare(right._id.toString());
}

function pickCanonicalPlayer(players, referenceCounts, preferredLeagueId) {
  const sorted = [...players].sort((left, right) => {
    const leftPreferred = left.league_id === preferredLeagueId ? 1 : 0;
    const rightPreferred = right.league_id === preferredLeagueId ? 1 : 0;
    if (leftPreferred !== rightPreferred) {
      return rightPreferred - leftPreferred;
    }

    const leftHasPhoto = left.photo_content_type && left.photo_data_base64 ? 1 : 0;
    const rightHasPhoto = right.photo_content_type && right.photo_data_base64 ? 1 : 0;
    if (leftHasPhoto !== rightHasPhoto) {
      return rightHasPhoto - leftHasPhoto;
    }

    const leftReferences = referenceCounts.get(getPlayerId(left)) ?? 0;
    const rightReferences = referenceCounts.get(getPlayerId(right)) ?? 0;
    if (leftReferences !== rightReferences) {
      return rightReferences - leftReferences;
    }

    return compareObjectIdsAscending(left, right);
  });

  return sorted[0];
}

function buildCanonicalUpdate(canonical, duplicates, tenantId) {
  const legacyLeagueIds = [...new Set(
    duplicates
      .map((player) => player.league_id)
      .filter((leagueId) => typeof leagueId === 'string' && leagueId.length > 0)
  )];

  const update = {
    $set: {
      tenant_id: tenantId,
      legacy_league_ids: legacyLeagueIds,
    }
  };

  if ((!canonical.photo_content_type || !canonical.photo_data_base64)) {
    const sourceWithPhoto = duplicates.find((player) => player.photo_content_type && player.photo_data_base64);
    if (sourceWithPhoto) {
      update.$set.photo_content_type = sourceWithPhoto.photo_content_type;
      update.$set.photo_data_base64 = sourceWithPhoto.photo_data_base64;
      if (sourceWithPhoto.photo_updated_at) {
        update.$set.photo_updated_at = sourceWithPhoto.photo_updated_at;
      }
    }
  }

  return update;
}

function rewriteTournamentPlayerIds(tournament, replacementMap) {
  let changed = false;

  const rewriteList = (items) => {
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
    players: rewriteList(tournament.players),
    bounties: rewriteList(tournament.bounties),
  };

  return {
    changed,
    replacement,
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
      tournamentsCollection.find({}).toArray(),
    ]);

    const leagueMap = buildLeagueMap(leagues);
    const referenceCounts = buildReferenceCounts(tournaments);
    const playersWithTenant = players.map((player) => ({
      ...player,
      tenant_id: resolveTenantId(player, leagueMap),
    }));

    const unresolvedPlayers = playersWithTenant.filter((player) => !player.tenant_id);
    const groups = new Map();

    for (const player of playersWithTenant) {
      if (!player.tenant_id) {
        continue;
      }

      const key = `${player.tenant_id}::${normalizeName(player.name)}`;
      const group = groups.get(key) ?? [];
      group.push(player);
      groups.set(key, group);
    }

    const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);
    const mergePlans = duplicateGroups.map((group) => {
      const canonical = pickCanonicalPlayer(group, referenceCounts, options.preferredLeagueId);
      const duplicates = group.filter((player) => getPlayerId(player) !== getPlayerId(canonical));
      return {
        tenantId: canonical.tenant_id,
        name: canonical.name,
        canonical,
        duplicates,
        players: group,
      };
    });

    const replacementMap = new Map();
    for (const plan of mergePlans) {
      const canonicalId = getPlayerId(plan.canonical);
      for (const duplicate of plan.duplicates) {
        replacementMap.set(getPlayerId(duplicate), canonicalId);
      }
    }

    const tournamentUpdates = tournaments
      .map((tournament) => ({
        tournamentId: tournament._id.toString(),
        ...rewriteTournamentPlayerIds(tournament, replacementMap),
      }))
      .filter((item) => item.changed);

    const summary = {
      mode: options.apply ? 'apply' : 'dry-run',
      database: options.dbName,
      preferredLeagueId: options.preferredLeagueId,
      totalPlayers: players.length,
      unresolvedPlayers: unresolvedPlayers.length,
      duplicateGroups: mergePlans.length,
      duplicatePlayersToDelete: mergePlans.reduce((count, plan) => count + plan.duplicates.length, 0),
      tournamentsToRewrite: tournamentUpdates.length,
      playersMissingTenantIdBackfill: playersWithTenant.filter((player) => !player.tenant_id || !player.tenant_id.length).length,
    };

    console.log(JSON.stringify(summary, null, 2));

    if (mergePlans.length === 0) {
      console.log('No duplicate player groups found.');
    } else {
      console.log('Duplicate merge plan:');
      for (const plan of mergePlans) {
        console.log(JSON.stringify({
          tenant_id: plan.tenantId,
          name: plan.name,
          canonical: getPlayerSummary(plan.canonical),
          duplicates: plan.duplicates.map(getPlayerSummary),
        }, null, 2));
      }
    }

    if (unresolvedPlayers.length > 0) {
      console.log('Players missing tenant resolution:');
      for (const player of unresolvedPlayers) {
        console.log(JSON.stringify(getPlayerSummary(player), null, 2));
      }
    }

    if (!options.apply) {
      console.log('Dry-run only. Re-run with --apply to write changes.');
      return;
    }

    for (const player of playersWithTenant) {
      if (!player.tenant_id) {
        continue;
      }

      await playersCollection.updateOne(
        { _id: player._id },
        { $set: { tenant_id: player.tenant_id } }
      );
    }

    for (const plan of mergePlans) {
      await playersCollection.updateOne(
        { _id: plan.canonical._id },
        buildCanonicalUpdate(plan.canonical, plan.players, plan.tenantId)
      );
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

    const duplicateIdsToDelete = mergePlans.flatMap((plan) => plan.duplicates.map((player) => player._id));
    if (duplicateIdsToDelete.length > 0) {
      await playersCollection.deleteMany({
        _id: { $in: duplicateIdsToDelete }
      });
    }

    console.log(`Applied merge for ${mergePlans.length} duplicate group(s).`);
    console.log(`Deleted ${duplicateIdsToDelete.length} duplicate player document(s).`);
    console.log(`Rewrote ${tournamentUpdates.length} tournament document(s).`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

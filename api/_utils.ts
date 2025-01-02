import { Collection, ObjectId } from 'mongodb';

type Player = {
  id: string;
  rebuys: number;
  ranking: number;
  prize: number;
}

export const sanitize = (item) => {
  if (item && typeof item === 'string') {
    return item.trim();
  } else {
    return item;
  }
};

export const fetchAllPlayers = async (collection, tenant_id) => {
    return await collection.find({tenant_id})
      // using collation so sort is case insensitive
      .collation({ locale: 'en' })
      .sort({ name: 1 })
      .toArray();
};

export const fetchAllSeasons = async (collection, tenant_id) => {
  return await collection.find({tenant_id})
    // using collation so sort is case insensitive
    .collation({ locale: 'en' })
    .sort({ name: 1 })
    .toArray();
};

export const fetchPlayerById = async (collection, playerId) => {
    return await collection.findOne({
      _id: new ObjectId(playerId)
    });
};

export const getTournaments = async (
  collection: Collection,
  tenant_id: string,
  seasonId?: string) => {
  const query = seasonId ? { tenant_id, 'season_id': seasonId } : { tenant_id} ;
  return await collection.find(query).sort({date: -1}).toArray();
};

export const getTournament = async (
  collection: Collection,
  tenant_id: string,
  tournamentId: string) => {
  const tournament = await collection.findOne({
    tenant_id,
    _id: new ObjectId(tournamentId)
  });
  return [tournament];
};

const getRebuys = (players) => {
  let rebuys = 0;
  players.forEach((player) => {
      rebuys += player.rebuys;
  });
  return rebuys;
};

const validateTournament = (count, buyin, players: Player[]) => {
  const totalprize = players.reduce((accumulator, player) => {
    return accumulator + player.prize
  }, 0);

  const buyIns = count * buyin;
  const rebuysTotal = getRebuys(players) * buyin;
  return totalprize === buyIns + rebuysTotal;
};

const createTournamentDocument = (req) => {
  const buyin = Number(req.body.buyin);
  const status = sanitize(req.body.status);
  const season_id = req.body.season_id;
  const tenant_id = req.body.tenant_id;
  const date = sanitize(req.body.date);

  // req.body.players is either undefined (when no player has been added to a tournament yet) or a string equal to id of a single player or an array of ids of multiple players
  // normalize req.body.players into an array
  if (req.body.players) {
    const playerIDs = (typeof req.body.players === 'string')
      ? [req.body.players]
      : req.body.players;
    const count = playerIDs.length;
    const players: Player[] = [];

    // set players and prizes
    for (let i=0; i<count; i++) {
      const player: Player = <Player>{};
      player.id = playerIDs[i];
      player.rebuys = Number(sanitize(req.body[`player_${player.id}_rebuys`]));
      player.ranking = Number(sanitize(req.body[`player_${player.id}_ranking`]));
      player.prize = Number(sanitize(req.body[`player_${player.id}_prize`]));
      players.push(player);
    }

    // sort players based on ranking for backward compatibility
    players.sort((player1, player2) => player1.ranking - player2.ranking)

    // if tournament is done validate data
    const isValid =  (status === 'done') ? validateTournament(count, buyin, players) : true;

    if (isValid) return {
      season_id,
      tenant_id,
      date,
      status,
      buyin,
      players
    };
  } else {
    return {
      season_id,
      tenant_id,
      date,
      status,
      buyin,
    };
  }
};

export const insertTournament = async (collection: Collection, req) => {
  const tournamentDoc = createTournamentDocument(req);
  if (tournamentDoc) {
    const respnose = await collection.insertOne(tournamentDoc);
    return respnose.insertedId;
  } else {
    return;
  }
};

export const editTournament = async (
  tournamentsCol: Collection,
  req,
  tournamentId: string) => {
  const tournamentDoc = createTournamentDocument(req);
  if (tournamentDoc) {
    const query = { _id: new ObjectId(tournamentId) };
    const response = await tournamentsCol.replaceOne(query, tournamentDoc);
    return response;
  } else {
    return;
  }
};

export const addNewPlayer = async (
  name: string,
  collection: Collection,
  tenant_id: string) => {
  const response = await collection.insertOne({name, tenant_id});
  console.log(response);
};

export const addNewSeason = async (
  name: string,
  collection: Collection,
  tenant_id: string) => {
  const response = await collection.insertOne({name, tenant_id});
  console.log(response);
};

export const editPlayerName = async (
  name: string,
  id: string,
  collection: Collection,
  tenant_id: string) => {
  const query = {tenant_id, _id: new ObjectId(id)};
  const response = await collection.updateOne(query, {
    $set: {name: name}
  });
  console.log(response);
};

export const editSeasonName = async (
  name: string,
  id: string,
  collection: Collection,
  tenant_id: string) => {
  const query = {tenant_id, _id: new ObjectId(id)};
  const response = await collection.updateOne(query, {
      $set: {name: name}
  });
  console.log(response);
};


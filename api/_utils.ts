import { Collection, ObjectId } from 'mongodb';

interface Player {
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

export const fetchAllPlayers = async (collection) => {
    return await collection.find()
      // using collation so sort is case insensitive
      .collation({ locale: 'en' })
      .sort({ name: 1 })
      .toArray();
};

export const fetchAllSeasons = async (collection) => {
  return await collection.find()
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
  seasonId?: string) => {
  const query = (seasonId) ? {'season_id': seasonId} : {};
  return await collection.find(query).sort({date: -1}).toArray();
};

export const getTournament = async (collection: Collection, tournamentId: string) => {
  const tournament = await collection.findOne({
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

const validateTournament = (count, buyin, prizes, players) => {
  const totalprize = prizes.reduce((accumulator, currentValue) => {
    return accumulator + currentValue
  }, 0);
  const buyIns = count * buyin;
  const rebuysTotal = getRebuys(players) * buyin;
  return totalprize === buyIns + rebuysTotal;
};

const createTournamentDocument = (req) => {
  console.log(req.body);
  // req.body.players is an array of all players IDs
  const count = Number(req.body.players.length);
  const buyin = Number(req.body.buyin);
  const status = sanitize(req.body.status);
  const season_id = req.body.season_id;
  const date = sanitize(req.body.date);
  const round = sanitize(req.body.round);
  const players: Player[] = [];
  const prizes: number[] = [];

  // set players and prizes
  for (let i=0; i<count; i++) {
    const player: Player = <Player>{};
    player.id = req.body.players[i];
    const prize = Number(sanitize(req.body[`player_${player.id}_prize`]));
    player.rebuys = Number(sanitize(req.body[`player_${player.id}_rebuys`]));
    player.ranking = Number(sanitize(req.body[`player_${player.id}_ranking`]));
    player.prize = prize;
    players.push(player);
    if (prize > 0) {
      prizes.push(prize);
    }
  }

  // sort players based on ranking for backward compatibility
  players.sort((player1, player2) => player1.ranking - player2.ranking)

  // if tournament is done validate data
  const isValid =  (status === 'done') ? validateTournament(count, buyin, prizes, players) : true;

  if (isValid) return {
    season_id,
    date,
    round,
    status,
    buyin,
    prizes,
    players
  };
};

export const insertTournament = async (tournamentsCol, req) => {
  const tournamentDoc = createTournamentDocument(req);

  if (tournamentDoc) {
    const respnose = await tournamentsCol.insertOne(tournamentDoc);
    return respnose.insertedId;
  } else {
    return;
  }
};

export const editTournament = async (tournamentsCol, req, tournamentId) => {
  const tournamentDoc = createTournamentDocument(req);
  console.log('------------- EDITING ', tournamentDoc);

  if (tournamentDoc) {
    const query = { _id: new ObjectId(tournamentId) };
    const response = await tournamentsCol.replaceOne(query, tournamentDoc);
    return response;
  } else {
    return;
  }
};

export const editPlayerName = async (name, playerId, collection) => {
  const query = { _id: new ObjectId(playerId) };
  await collection.updateOne(query, {
      $set: {
        name: name
      }
  });
  console.log(`Changed name of an existing player to ${name}`);
};

export const addNewPlayer = async (name, collection) => {
  const insertResponse = await collection.insertOne({ name: name });
  console.log(`Added new player with name ${name} and id `, insertResponse.insertedId);
};

export const editSeasonName = async (name, seasonId, collection) => {
  const query = { _id: new ObjectId(seasonId) };
  await collection.updateOne(query, {
      $set: {
        name: name
      }
  });
  console.log(`Changed name of an existing season to ${name}`);
};

export const addNewSeason = async (name, collection) => {
  const insertResponse = await collection.insertOne({ name: name });
  console.log(`Added new season with name ${name} and id `, insertResponse.insertedId);
};

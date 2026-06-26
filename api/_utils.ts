import { Collection, DeleteResult, Document, InsertOneResult, ObjectId } from 'mongodb';
import { JwtPayload } from '../public/ts/types';
import { getJwtPayload } from './verifyAuth.js';

type Player = {
  id: string;
  name?: string;
  rebuys: number;
  ranking: number;
  prize: number;
};

type LeagueDocument = {
  _id: ObjectId;
  tenant_id: string;
};

type NamedDocument = {
  _id?: ObjectId;
  name: string;
  league_id?: string;
  tenant_id?: string;
  photo_content_type?: string;
  photo_data_base64?: string;
};

type TournamentDocument = {
  _id?: ObjectId;
  season_id: string;
  league_id: string;
  date: string;
  status: string;
  buyin: number;
  players?: Player[];
};

type RequestBody = {
  buyin?: string | number;
  status?: string;
  season_id?: string;
  league_id?: string;
  tournament_id?: string;
  players?: string | string[];
  form_action?: string;
  [key: string]: unknown;
};

type RequestLike = {
  body: RequestBody;
};

type ValidationResult = {
  isValid: boolean;
  error: string;
};

type CreateTournamentDocumentResult =
  | { document: TournamentDocument }
  | { error: string };

export const userOwnsLeague = async (
  league_id: string,
  req: unknown,
  collection: Collection<LeagueDocument>,
): Promise<boolean> => {
  if (!league_id || league_id.length === 0) {
    return false;
  }

  const payload: JwtPayload = await getJwtPayload(req);
  const tenant_id = payload.id;
  if (!tenant_id) return false;
  const league = await collection.findOne({
    _id: ObjectId.createFromHexString(league_id)
  });
  return league?.tenant_id === tenant_id;
};

export const sanitize = <T>(item: T): T | string => {
  if (item && typeof item === 'string') {
    return item.trim();
  } else {
    return item;
  }
};

export const findNameConflict = async (
  collection: Collection<NamedDocument>,
  scope: Record<string, unknown>,
  name: string,
  currentId?: string,
): Promise<NamedDocument | null> => {
  const query: Record<string, unknown> = { ...scope, name };
  if (currentId) {
    query._id = { $ne: ObjectId.createFromHexString(currentId) };
  }

  return await collection.findOne(
    query,
    // Use case-insensitive matching so differently-cased names still conflict.
    { collation: { locale: 'en', strength: 2 } }
  );
};

export const fetchAllPlayers = async (
  collection: Collection<NamedDocument>,
  league_id: string,
) => {
    return await collection.find(
      { league_id },
      { projection: { photo_content_type: 0, photo_data_base64: 0 } }
    )
      // using collation so sort is case insensitive
      .collation({ locale: 'en' })
      .sort({ name: 1 })
      .toArray();
};

export const fetchAllSeasons = async (
  collection: Collection<NamedDocument>,
  league_id: string,
) => {
  return await collection.find({league_id})
    // using collation so sort is case insensitive
    .collation({ locale: 'en' })
    .sort({ name: 1 })
    .toArray();
};

export const fetchAllLeagues = async (
  collection: Collection<NamedDocument>,
  tenant_id?: string,
) => {
  const filter = tenant_id ? { tenant_id } : {};
  return await collection.find(filter)
    // using collation so sort is case insensitive
    .collation({ locale: 'en' })
    .sort({ name: 1 })
    .toArray();
};

export const fetchPlayerById = async (
  collection: Collection<NamedDocument>,
  playerId: string,
) => {
    return await collection.findOne({
      _id: ObjectId.createFromHexString(playerId)
    });
};

export const validateTournamentPlayersExist = async (
  collection: Collection<NamedDocument>,
  league_id: string,
  players: Player[] = [],
): Promise<ValidationResult> => {
  if (players.length === 0) {
    return {
      isValid: true,
      error: ''
    };
  }

  const seenPlayerIds = new Set<string>();
  const duplicatePlayers: Player[] = [];
  players.forEach((player) => {
    if (seenPlayerIds.has(player.id)) {
      duplicatePlayers.push(player);
      return;
    }
    seenPlayerIds.add(player.id);
  });

  if (duplicatePlayers.length > 0) {
    return {
      isValid: false,
      error: `Tournament submission contains duplicate player id(s): ${duplicatePlayers.map((player) => player.id).join(', ')}. Please refresh and try again.`
    };
  }

  const objectIds = players.map((player) => {
    if (!ObjectId.isValid(player.id)) {
      throw new Error(`Invalid player id: ${player.id}`);
    }
    return ObjectId.createFromHexString(player.id);
  });

  const existingPlayers = await collection.find({
    league_id,
    _id: { $in: objectIds }
  }, {
    projection: { _id: 1 }
  }).toArray();

  const existingIds = new Set(existingPlayers.map((player) => player._id.toString()));
  const missingPlayers = players.filter((player) => !existingIds.has(player.id));

  return {
    isValid: missingPlayers.length === 0,
    error: missingPlayers.length === 0
      ? ''
      : `Player with id ${missingPlayers.map((player) => player.id).join(', ')} no longer exists in the database. Please refresh the browser to update the players cached in the app.`
  };
};

export const getSubmittedTournamentPlayers = (req: RequestLike): Player[] => {
  if (!req.body.players) {
    return [];
  }

  const playerIDs = (typeof req.body.players === 'string')
    ? [req.body.players]
    : req.body.players;

  return playerIDs.map((playerId) => ({
    id: playerId,
    rebuys: Number(sanitize(req.body[`player_${playerId}_rebuys`])),
    ranking: Number(sanitize(req.body[`player_${playerId}_ranking`])),
    prize: Number(sanitize(req.body[`player_${playerId}_prize`])),
  }));
};

export const getTournaments = async (
  collection: Collection<TournamentDocument>,
  league_id: string,
  seasonId?: string,
) => {
  const query = seasonId ? { league_id, 'season_id': seasonId } : { league_id} ;
  return await collection.find(query).sort({date: -1}).toArray();
};

export const getTournament = async (
  collection: Collection<TournamentDocument>,
  league_id: string,
  tournamentId: string,
) => {
  const tournament = await collection.findOne({
    league_id,
    _id: ObjectId.createFromHexString(tournamentId)
  });
  return tournament ? [tournament] : [];
};

const getRebuys = (players: Player[]): number => {
  let rebuys = 0;
  players.forEach((player: Player) => {
      rebuys += player.rebuys;
  });
  return rebuys;
};

const validateTournament = (count: number, buyin: number, players: Player[]): ValidationResult => {
  const validation: ValidationResult = {
    isValid: true,
    error: ''
  };

  // validate against no players set
  if (!players || players.length === 0) {
      validation.isValid = false;
      validation.error = 'No player is added';
  }

  // validate against ranking not set for a player
  players.forEach((player: Player) => {
    if (player.ranking === 0) {
      validation.isValid = false;
      validation.error = 'Ranking 0 is now allowed';
    }
  });
  if (!validation.isValid) return validation;

  // validate total prize
  const totalprize = players.reduce((accumulator, player) => {
    return accumulator + player.prize
  }, 0);
  const buyIns = count * buyin;
  const rebuysTotal = getRebuys(players) * buyin;
  if (totalprize !== buyIns + rebuysTotal) {
    validation.isValid = false;
    validation.error = `Total prize (${totalprize}) doesn't match sum of all buyins (${buyIns}) and rebuys (${rebuysTotal})`;
    return validation;
  }

  // tournament data is valid
  return validation;
};

export const createTournamentDocument = (req: RequestLike): CreateTournamentDocumentResult => {
  const buyin = Number(req.body.buyin);
  const status = String(sanitize(req.body.status ?? ''));
  const season_id = String(req.body.season_id ?? '');
  const league_id = String(req.body.league_id ?? '');
  const date = String(sanitize(req.body.date ?? ''));
  const submittedPlayers = getSubmittedTournamentPlayers(req);

  // Parse submitted player form fields into structured player objects.
  if (submittedPlayers.length > 0) {
    const count = submittedPlayers.length;
    const players: Player[] = submittedPlayers.map((player) => ({
      id: player.id,
      rebuys: player.rebuys,
      ranking: player.ranking,
      prize: player.prize,
    }));

    // sort players based on ranking for backward compatibility
    players.sort((player1, player2) => player1.ranking - player2.ranking)

    // if tournament is done validate the data
    const validation = (status === 'done')
      ? validateTournament(count, buyin, players)
      : { isValid: true, error: '' };

    if (validation.isValid) {
      return {
        document: {
          season_id,
          league_id,
          date,
          status,
          buyin,
          players
        }
      }
    } else {
      return {
        error: validation.error
      }
    }
  } else {
    if (req.body.status === 'upcoming') {
      return {
        document: {
          season_id,
          league_id,
          date,
          status,
          buyin,
        }
      }
    } else {
      return {
        error: 'Tournements that are in progress or done must have players'
      }
    }
  }
};

export const duplicateTournament = async (
  collection: Collection<TournamentDocument>,
  req: RequestLike,
): Promise<InsertOneResult<TournamentDocument>> => {
    const tournamentId = req.body.tournament_id;
    if (!tournamentId) {
      throw new Error('Missing tournament id');
    }
    const tournament = await collection.findOne(
      {_id: ObjectId.createFromHexString(tournamentId)},
      {projection: { _id: 0 }}
    );
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // reset status, date, and players before inserting
    tournament.status = 'upcoming';
    tournament.date = new Date().toISOString().split('T')[0];
    const players = tournament.players ?? [];
    if (players.length > 0) {
      players.forEach((player: Player) => {
        player.rebuys = 0;
        player.ranking = 0;
        player.prize = 0;
      });
    }

    const response = await collection.insertOne(tournament);
    return response;
};

export const deleteTournament = async (
  collection: Collection<TournamentDocument>,
  req: RequestLike,
): Promise<DeleteResult> => {
    const tournamentId = req.body.tournament_id;
    if (!tournamentId) {
      throw new Error('Missing tournament id');
    }
    const tournament = await collection.findOne(
      {_id: ObjectId.createFromHexString(tournamentId)},
      {projection: { _id: 0 }}
    );
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    const response = await collection.deleteOne(tournament);
    return response;
};

export const addNewPlayer = async (
  name: string,
  collection: Collection<NamedDocument>,
  league_id: string,
): Promise<InsertOneResult<NamedDocument>> => {
  const response = await collection.insertOne({name, league_id});
  console.log(response);
  return response;
};

export const addNewSeason = async (
  name: string,
  collection: Collection<NamedDocument>,
  league_id: string,
): Promise<void> => {
  const response = await collection.insertOne({name, league_id});
  console.log(response);
};

export const addNewLeague = async (
  name: string,
  collection: Collection<NamedDocument>,
  tenant_id: string,
): Promise<InsertOneResult<NamedDocument>> => {
  const response = await collection.insertOne({name, tenant_id});
  console.log(response);
  return response;
};

export const editPlayerName = async (
  name: string,
  id: string,
  collection: Collection<NamedDocument>,
  league_id: string,
): Promise<void> => {
  const query = {league_id, _id: ObjectId.createFromHexString(id)};
  const response = await collection.updateOne(query, {
    $set: {name: name}
  });
  console.log(response);
};

export const editSeasonName = async (
  name: string,
  id: string,
  collection: Collection<NamedDocument>,
  league_id: string,
): Promise<void> => {
  const query = {league_id, _id: ObjectId.createFromHexString(id)};
  const response = await collection.updateOne(query, {
      $set: {name: name}
  });
  console.log(response);
};

export const editLeagueName = async (
  name: string,
  collection: Collection<Document>,
  league_id: string,
  default_season_id?: string,
  default_timer_id?: string,
): Promise<void> => {
  const query = {_id: ObjectId.createFromHexString(league_id)};
  const update = default_timer_id
    ? {
        $set: {name, default_season_id, default_timer_id}
      }
    : {
        $set: {name, default_season_id},
        $unset: {default_timer_id: ''}
      };
  const response = await collection.updateOne(query, {
      ...update
    });
  console.log(response);
};

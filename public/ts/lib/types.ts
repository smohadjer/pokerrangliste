export interface Player {
  id: any,
  name?: string,
  rebuys: number,
  ranking: number,
  points: number,
  bounty: number,
  prize: number,
  games: number
}

export interface PlayerDB {
  readonly _id: {},
  name: string
}

export type bounty = {
  prize: number;
  readonly id: {}
}

export interface Tournament {
  readonly _id: {};
  date: string;
  round: number;
  buyin: number;
  rebuys: number;
  prizes: number[];
  players: Player[];
  season_id: string;
  bounties?: bounty[];
  hasBounty?: string;
}

export interface Profile {
  date: string,
  _id: {},
  ranking: number,
  rebuys: number,
  players: number,
  points: number
}

export interface Season {
  _id: string,
  name: string
}

export interface Data {
  tournaments: Tournament[],
  seasons: Season[],
  players: PlayerDB[],
  error?: string,
  message?: string
}

export type State = {
  season_id?: string;
  tournament_id?: string;
  player_id?: string;
  view: string | null;
  data?: Data;
  defaultView: string;
}

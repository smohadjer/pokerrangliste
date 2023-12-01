export interface Player {
  id: any,
  name?: string,
  rebuys: number,
  ranking: number,
  points: number,
  bounty?: number,
  prize?: number,
  games?: number
}

export interface PlayerDB {
  _id: {},
  name: string
}

export interface Tournament {
  _id: {},
  date: string,
  round: number,
  buyin: number,
  rebuys: number,
  prizes: number[],
  players: Player[],
  season_id: string
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

export interface JsonData {
  tournaments: Tournament[],
  seasons: Season[],
  players: PlayerDB[],
  error?: string,
  message?: string
}

export interface State {
  seasonId?: string
  tournament_id?: string
  player_id?: string
  view: string
  json?: JsonData,
}

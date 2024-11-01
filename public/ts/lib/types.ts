export interface Player {
  id: any,
  name?: string,
  rebuys: number,
  ranking: number,
  points: number,
  bounty: number,
  prize: number,
  games?: number
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
  firstPlace?: string;
  secondPlace?: string;
}

export type Profile = {
  date: string;
  _id: {};
  ranking: number;
  rebuys: number;
  players: number;
  points: number;
}

export type ChartData = Profile & {
  sum: number;
}

export interface Season {
  _id: string,
  name: string
}

export interface Json extends State {
  error? : string,
  message? : string
}

export type State = {
  tournaments: Tournament[];
  seasons: Season[];
  players: PlayerDB[];
}

export type RenderOptions =  {
  animation?: string;
}

export type RouteParams = {
  [key: string]: string;
}

export type Route = {
  view: string;
  params: RouteParams;
}

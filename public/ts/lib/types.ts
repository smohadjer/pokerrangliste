export type Player = {
  id: string;
  name?: string;
  rebuys: number;
  ranking: number;
  points: number;
  bounty: number;
  prize: number;
  games?: number;
};

export type PlayerDB = {
  readonly _id: string;
  name: string;
}

export type Season = {
  readonly _id: string;
  name: string;
}

export type bounty = {
  prize: number;
  readonly id: {}
}

export interface Tournament {
  readonly _id: {};
  date: string;
  buyin: number;
  rebuys: number;
  prizes: number[];
  players: Player[];
  season_id: string;
  bounties?: bounty[];
  hasBounty?: string;
  firstPlace?: string;
  secondPlace?: string;
  status?: 'upcoming' | 'pending' | 'done';
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

export interface Json extends State {
  error? : string,
  message? : string
}

export type Tenant = {
  id?: string;
  name?: string
}

export type State = {
  tournaments: Tournament[];
  seasons: Season[];
  players: PlayerDB[];
  tenant: Tenant;
}

export type RenderPageOptions =  {
  animation?: string;
  type: string;
}

export type RenderOptions = {
  view: string;
  templateData: any;
  renderOptions: RenderPageOptions;
};

export type RouteParams = {
  [key: string]: string;
}

export type Route = {
  view: string;
  //params: RouteParams;
  params: string;
}

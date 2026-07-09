export enum MatchStatus {
  Scheduled = 0,
  Live = 1,
  Finished = 2,
  Cancelled = 3
}

export interface Match {
  id: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  matchDate: string;
  status: MatchStatus;
}

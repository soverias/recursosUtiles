export interface RoomInfo {
  roomId: string;
  code?: string;
  opponentUsername: string;
}

export interface RoundResult {
  winnerId: string;
  loserId: string;
  winnerReactionMs: number;
  loserReactionMs: number;
  isFalseStart: boolean;
}

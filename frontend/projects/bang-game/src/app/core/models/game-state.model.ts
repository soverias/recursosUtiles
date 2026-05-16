export type GamePhase =
  | 'idle'
  | 'waiting-opponent'
  | 'both-ready'
  | 'countdown'
  | 'waiting-bang'
  | 'bang-active'
  | 'result'
  | 'waiting-rematch';

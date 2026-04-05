export interface User {
  id: string;
  username: string;
  token: string;
}

export interface GuestUser {
  id: string;
  username: string;
}

export type AuthState =
  | { kind: 'authenticated'; user: User }
  | { kind: 'guest'; user: GuestUser }
  | { kind: 'anonymous' };

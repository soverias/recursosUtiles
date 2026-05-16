-- Bang Game database schema
-- Run once on a fresh database.

CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    is_guest      BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS game_results (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    winner_id           UUID        REFERENCES users(id),
    loser_id            UUID        REFERENCES users(id),
    winner_reaction_ms  INT         NOT NULL,
    loser_reaction_ms   INT         NOT NULL,
    is_false_start      BOOLEAN     NOT NULL,
    played_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_results_winner_id ON game_results(winner_id);
CREATE INDEX IF NOT EXISTS idx_game_results_loser_id  ON game_results(loser_id);

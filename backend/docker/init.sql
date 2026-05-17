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

-- Reminders (push notifications for habit-tracker)
-- Schema: (local_time, timezone) for recurring wall-clock semantics.
-- last_fired_date acts as daily dedupe lock.
-- Identity: (user_id, habit_id) — natural composite PK.
CREATE TABLE IF NOT EXISTS reminders (
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_id        UUID        NOT NULL,
    local_time      CHAR(5)     NOT NULL,
    timezone        TEXT        NOT NULL,
    endpoint        TEXT        NOT NULL,
    p256dh          TEXT        NOT NULL,
    auth_key        TEXT        NOT NULL,
    last_fired_date DATE        NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, habit_id)
);

-- Cron filters by last_fired_date. Simple B-tree is enough for our scale.
-- If table grows past ~100K rows AND EXPLAIN ANALYZE shows heap I/O is the bottleneck,
-- consider adding a covering INCLUDE (user_id, habit_id, local_time, timezone, endpoint, p256dh, auth_key).
CREATE INDEX IF NOT EXISTS idx_reminders_last_fired ON reminders(last_fired_date);

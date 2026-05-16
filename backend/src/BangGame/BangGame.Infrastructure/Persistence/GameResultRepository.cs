using BangGame.Domain.Entities;
using BangGame.Domain.Ports;
using Npgsql;

namespace BangGame.Infrastructure.Persistence;

public sealed class GameResultRepository(DbConnectionFactory factory) : IGameResultRepository
{
    public async Task AddAsync(GameResult result, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO game_results
                (id, winner_id, loser_id, winner_reaction_ms, loser_reaction_ms, is_false_start, played_at)
            VALUES
                (@id, @winnerId, @loserId, @winnerMs, @loserMs, @isFalseStart, @playedAt)
            """;
        cmd.Parameters.AddWithValue("@id",           result.Id);
        cmd.Parameters.AddWithValue("@winnerId",     result.WinnerId);
        cmd.Parameters.AddWithValue("@loserId",      result.LoserId);
        cmd.Parameters.AddWithValue("@winnerMs",     result.WinnerReactionMs);
        cmd.Parameters.AddWithValue("@loserMs",      result.LoserReactionMs);
        cmd.Parameters.AddWithValue("@isFalseStart", result.IsFalseStart);
        cmd.Parameters.AddWithValue("@playedAt",     result.PlayedAt);

        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<IReadOnlyList<RankingEntry>> GetRankingAsync(CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        // CTE: wins + avg reaction from winner rows; total games from both winner and loser rows
        cmd.CommandText = """
            WITH wins AS (
                SELECT winner_id,
                       COUNT(*) AS wins,
                       COALESCE(AVG(winner_reaction_ms) FILTER (WHERE NOT is_false_start), 0) AS avg_reaction_ms
                FROM game_results
                GROUP BY winner_id
            ),
            total_games AS (
                SELECT player_id, COUNT(*) AS total
                FROM (
                    SELECT winner_id AS player_id FROM game_results
                    UNION ALL
                    SELECT loser_id  AS player_id FROM game_results
                ) g
                GROUP BY player_id
            )
            SELECT
                u.username,
                COALESCE(w.wins, 0)::INT                                         AS wins,
                COALESCE(w.avg_reaction_ms, 0)::FLOAT8                           AS avg_reaction_ms,
                CASE WHEN COALESCE(t.total, 0) = 0 THEN 0::FLOAT8
                     ELSE COALESCE(w.wins, 0)::FLOAT8 / t.total
                END                                                              AS win_ratio
            FROM users u
            LEFT JOIN wins        w ON w.winner_id = u.id
            LEFT JOIN total_games t ON t.player_id = u.id
            WHERE u.is_guest = FALSE
            ORDER BY wins DESC
            """;

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        var rows = new List<RankingEntry>();

        while (await reader.ReadAsync(ct))
        {
            rows.Add(new RankingEntry(
                reader.GetString(0),
                reader.GetInt32(1),
                reader.GetDouble(2),
                reader.GetDouble(3)));
        }

        return rows.AsReadOnly();
    }
}

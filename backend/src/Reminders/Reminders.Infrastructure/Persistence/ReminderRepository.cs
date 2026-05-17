using Npgsql;
using Reminders.Domain.Entities;
using Reminders.Domain.Ports;
using Reminders.Domain.ValueObjects;

namespace Reminders.Infrastructure.Persistence;

public sealed class ReminderRepository(DbConnectionFactory factory) : IReminderRepository
{
    private const string SelectColumns =
        "user_id, habit_id, local_time, timezone, endpoint, p256dh, auth_key, last_fired_date, created_at";

    public async Task<IReadOnlyList<Reminder>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT {SelectColumns} FROM reminders WHERE user_id = @userId ORDER BY created_at";
        cmd.Parameters.AddWithValue("@userId", userId);

        var list = new List<Reminder>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) list.Add(Map(reader));
        return list;
    }

    public async Task<Reminder?> FindByUserAndHabitAsync(Guid userId, Guid habitId, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT {SelectColumns} FROM reminders WHERE user_id = @userId AND habit_id = @habitId";
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@habitId", habitId);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? Map(reader) : null;
    }

    public async Task UpsertAsync(Reminder reminder, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO reminders (user_id, habit_id, local_time, timezone, endpoint, p256dh, auth_key, last_fired_date, created_at)
            VALUES (@userId, @habitId, @localTime, @tz, @endpoint, @p256dh, @auth, @lastFired, @createdAt)
            ON CONFLICT (user_id, habit_id) DO UPDATE SET
                local_time = EXCLUDED.local_time,
                timezone   = EXCLUDED.timezone,
                endpoint   = EXCLUDED.endpoint,
                p256dh     = EXCLUDED.p256dh,
                auth_key   = EXCLUDED.auth_key
            """;
        cmd.Parameters.AddWithValue("@userId",     reminder.UserId);
        cmd.Parameters.AddWithValue("@habitId",    reminder.HabitId);
        cmd.Parameters.AddWithValue("@localTime",  reminder.LocalTime.ToString());
        cmd.Parameters.AddWithValue("@tz",         reminder.Timezone);
        cmd.Parameters.AddWithValue("@endpoint",   reminder.Subscription.Endpoint);
        cmd.Parameters.AddWithValue("@p256dh",     reminder.Subscription.P256dh);
        cmd.Parameters.AddWithValue("@auth",       reminder.Subscription.Auth);
        cmd.Parameters.AddWithValue("@lastFired",  (object?)reminder.LastFiredDate ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@createdAt",  reminder.CreatedAt);

        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task DeleteAsync(Guid userId, Guid habitId, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM reminders WHERE user_id = @userId AND habit_id = @habitId";
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@habitId", habitId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<IReadOnlyList<Reminder>> GetDueAsync(CancellationToken ct = default)
    {
        // Fire all reminders whose today's local firing instant <= now AND not yet fired today (local).
        const string sql = """
            SELECT user_id, habit_id, local_time, timezone, endpoint, p256dh, auth_key, last_fired_date, created_at
            FROM reminders r
            WHERE (
                (date_trunc('day', now() AT TIME ZONE r.timezone)
                  + ((r.local_time || ':00')::interval)) AT TIME ZONE r.timezone
              ) <= now()
              AND (r.last_fired_date IS NULL
                   OR r.last_fired_date < (now() AT TIME ZONE r.timezone)::date)
            """;

        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;

        var list = new List<Reminder>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) list.Add(Map(reader));
        return list;
    }

    public async Task<DateTime?> GetNextFiringUtcAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT MIN(
              CASE
                WHEN (r.last_fired_date IS NULL OR r.last_fired_date < (now() AT TIME ZONE r.timezone)::date)
                  THEN (date_trunc('day', now() AT TIME ZONE r.timezone)
                       + (r.local_time || ':00')::interval) AT TIME ZONE r.timezone
                ELSE (date_trunc('day', now() AT TIME ZONE r.timezone) + interval '1 day'
                     + (r.local_time || ':00')::interval) AT TIME ZONE r.timezone
              END
            )
            FROM reminders r
            """;

        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;

        var result = await cmd.ExecuteScalarAsync(ct);
        if (result is null || result is DBNull) return null;
        var utc = ((DateTime)result).ToUniversalTime();
        return utc < DateTime.UtcNow ? DateTime.UtcNow : utc;
    }

    public async Task MarkFiredAsync(Guid userId, Guid habitId, DateOnly localDate, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "UPDATE reminders SET last_fired_date = @date WHERE user_id = @userId AND habit_id = @habitId";
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@habitId", habitId);
        cmd.Parameters.AddWithValue("@date", localDate);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    private static Reminder Map(NpgsqlDataReader r)
    {
        var lastFired = r.IsDBNull(7) ? (DateOnly?)null : r.GetFieldValue<DateOnly>(7);
        return new Reminder(
            r.GetGuid(0),
            r.GetGuid(1),
            LocalTime.Parse(r.GetString(2).Trim()),
            r.GetString(3),
            new PushSubscriptionVo(r.GetString(4), r.GetString(5), r.GetString(6)),
            lastFired,
            r.GetDateTime(8));
    }
}

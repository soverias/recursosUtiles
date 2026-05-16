using BangGame.Domain.Entities;
using BangGame.Domain.Ports;
using Npgsql;

namespace BangGame.Infrastructure.Persistence;

public sealed class UserRepository(DbConnectionFactory factory) : IUserRepository
{
    public async Task<User?> FindByUsernameAsync(string username, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText =
            "SELECT id, username, password_hash, is_guest FROM users WHERE username = @username";
        cmd.Parameters.AddWithValue("@username", username);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? MapUser(reader) : null;
    }

    public async Task<User?> FindByIdAsync(Guid id, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText =
            "SELECT id, username, password_hash, is_guest FROM users WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? MapUser(reader) : null;
    }

    public async Task<bool> ExistsAsync(string username, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT 1 FROM users WHERE username = @username LIMIT 1";
        cmd.Parameters.AddWithValue("@username", username);

        return await cmd.ExecuteScalarAsync(ct) is not null;
    }

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        await using var conn = factory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO users (id, username, password_hash, is_guest)
            VALUES (@id, @username, @passwordHash, @isGuest)
            """;
        cmd.Parameters.AddWithValue("@id",           user.Id);
        cmd.Parameters.AddWithValue("@username",     user.Username);
        cmd.Parameters.AddWithValue("@passwordHash", user.PasswordHash);
        cmd.Parameters.AddWithValue("@isGuest",      user.IsGuest);

        await cmd.ExecuteNonQueryAsync(ct);
    }

    private static User MapUser(NpgsqlDataReader r) =>
        new(r.GetGuid(0), r.GetString(1), r.GetString(2), r.GetBoolean(3));
}

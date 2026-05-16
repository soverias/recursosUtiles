using Npgsql;

namespace BangGame.Infrastructure.Persistence;

public sealed class DbConnectionFactory(string connectionString)
{
    public NpgsqlConnection CreateConnection() => new(connectionString);
}

using Npgsql;

namespace RecursosUtiles.Auth.Infrastructure.Persistence;

public sealed class DbConnectionFactory(string connectionString)
{
    public NpgsqlConnection CreateConnection() => new(connectionString);
}

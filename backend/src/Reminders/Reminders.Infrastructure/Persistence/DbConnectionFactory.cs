using Npgsql;

namespace Reminders.Infrastructure.Persistence;

public sealed class DbConnectionFactory(string connectionString)
{
    public NpgsqlConnection CreateConnection() => new(connectionString);
}

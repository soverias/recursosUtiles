using Reminders.Domain.Entities;

namespace Reminders.Domain.Ports;

public interface IReminderRepository
{
    Task<IReadOnlyList<Reminder>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Reminder?> FindByUserAndHabitAsync(Guid userId, Guid habitId, CancellationToken ct = default);
    Task UpsertAsync(Reminder reminder, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid habitId, CancellationToken ct = default);

    /// <summary>Reminders whose firing instant (today, local) is &lt;= now AND that haven't been fired today.</summary>
    Task<IReadOnlyList<Reminder>> GetDueAsync(CancellationToken ct = default);

    /// <summary>Next UTC instant at which ANY reminder will be due. Null if none.</summary>
    Task<DateTime?> GetNextFiringUtcAsync(CancellationToken ct = default);

    Task MarkFiredAsync(Guid userId, Guid habitId, DateOnly localDate, CancellationToken ct = default);
}

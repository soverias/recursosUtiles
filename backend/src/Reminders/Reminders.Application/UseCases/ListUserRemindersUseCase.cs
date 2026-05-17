using Reminders.Application.DTOs;
using Reminders.Domain.Ports;

namespace Reminders.Application.UseCases;

public sealed class ListUserRemindersUseCase(IReminderRepository repository)
{
    public async Task<IReadOnlyList<ReminderResponse>> ExecuteAsync(Guid userId, CancellationToken ct = default)
    {
        var reminders = await repository.GetByUserIdAsync(userId, ct);
        return reminders
            .Select(r => new ReminderResponse(r.HabitId, r.LocalTime.ToString(), r.Timezone, r.CreatedAt))
            .ToList();
    }
}

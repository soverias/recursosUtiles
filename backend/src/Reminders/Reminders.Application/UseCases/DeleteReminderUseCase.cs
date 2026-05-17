using Reminders.Domain.Ports;
using RecursosUtiles.SharedKernel;

namespace Reminders.Application.UseCases;

public sealed class DeleteReminderUseCase(
    IReminderRepository repository,
    IRemindersKicker kicker)
{
    public async Task<Result> ExecuteAsync(Guid userId, Guid habitId, CancellationToken ct = default)
    {
        var existing = await repository.FindByUserAndHabitAsync(userId, habitId, ct);
        if (existing is null)
            return Result.Failure(Error.NotFound("Reminders.NotFound", "Recordatorio no encontrado"));

        await repository.DeleteAsync(userId, habitId, ct);
        kicker.Kick();
        return Result.Success();
    }
}

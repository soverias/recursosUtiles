using Reminders.Application.DTOs;
using Reminders.Domain.Entities;
using Reminders.Domain.Ports;
using Reminders.Domain.ValueObjects;
using RecursosUtiles.SharedKernel;

namespace Reminders.Application.UseCases;

public sealed class UpsertReminderUseCase(
    IReminderRepository repository,
    IRemindersKicker kicker)
{
    public async Task<Result<ReminderResponse>> ExecuteAsync(
        Guid userId,
        UpsertReminderRequest request,
        CancellationToken ct = default)
    {
        if (!LocalTime.TryParse(request.LocalTime, out var localTime))
            return Result.Failure<ReminderResponse>(
                Error.Validation("Reminders.InvalidLocalTime", "localTime debe ser 'HH:mm'"));

        if (string.IsNullOrWhiteSpace(request.Timezone))
            return Result.Failure<ReminderResponse>(
                Error.Validation("Reminders.InvalidTimezone", "timezone es obligatorio"));

        if (!IsValidIanaTimezone(request.Timezone))
            return Result.Failure<ReminderResponse>(
                Error.Validation("Reminders.UnknownTimezone", $"timezone '{request.Timezone}' no es IANA válida"));

        if (request.PushSubscription is null
            || string.IsNullOrWhiteSpace(request.PushSubscription.Endpoint)
            || string.IsNullOrWhiteSpace(request.PushSubscription.P256dh)
            || string.IsNullOrWhiteSpace(request.PushSubscription.Auth))
        {
            return Result.Failure<ReminderResponse>(
                Error.Validation("Reminders.InvalidSubscription", "pushSubscription incompleta"));
        }

        var subscription = new PushSubscriptionVo(
            request.PushSubscription.Endpoint,
            request.PushSubscription.P256dh,
            request.PushSubscription.Auth);

        var existing = await repository.FindByUserAndHabitAsync(userId, request.HabitId, ct);
        Reminder reminder;

        if (existing is null)
        {
            // If creating after today's local time has passed, mark today as fired so next firing is tomorrow.
            var tz = TimeZoneInfo.FindSystemTimeZoneById(request.Timezone);
            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            var lastFired = (nowLocal.Hour * 60 + nowLocal.Minute) > (localTime.Hour * 60 + localTime.Minute)
                ? (DateOnly?)DateOnly.FromDateTime(nowLocal)
                : null;

            reminder = new Reminder(
                userId,
                request.HabitId,
                localTime,
                request.Timezone,
                subscription,
                lastFired,
                DateTime.UtcNow);
        }
        else
        {
            existing.UpdateScheduling(localTime, request.Timezone, subscription);
            reminder = existing;
        }

        await repository.UpsertAsync(reminder, ct);
        kicker.Kick();

        return Result.Success(new ReminderResponse(
            reminder.HabitId, reminder.LocalTime.ToString(), reminder.Timezone, reminder.CreatedAt));
    }

    private static bool IsValidIanaTimezone(string tz)
    {
        try { _ = TimeZoneInfo.FindSystemTimeZoneById(tz); return true; }
        catch { return false; }
    }
}

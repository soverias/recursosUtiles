namespace Reminders.Application.DTOs;

public sealed record PushSubscriptionDto(string Endpoint, string P256dh, string Auth);

public sealed record UpsertReminderRequest(
    Guid HabitId,
    string LocalTime,
    string Timezone,
    PushSubscriptionDto PushSubscription);

public sealed record ReminderResponse(
    Guid HabitId,
    string LocalTime,
    string Timezone,
    DateTime CreatedAt);

public sealed record VapidPublicKeyResponse(string PublicKey);

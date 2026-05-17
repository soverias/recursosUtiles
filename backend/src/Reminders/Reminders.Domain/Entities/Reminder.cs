using Reminders.Domain.ValueObjects;

namespace Reminders.Domain.Entities;

/// <summary>
/// Identity is the composite (UserId, HabitId) — no synthetic id.
/// Does not derive from Entity&lt;Guid&gt;.
/// </summary>
public sealed class Reminder
{
    public Guid UserId { get; }
    public Guid HabitId { get; }
    public LocalTime LocalTime { get; private set; }
    public string Timezone { get; private set; }
    public PushSubscriptionVo Subscription { get; private set; }
    public DateOnly? LastFiredDate { get; private set; }
    public DateTime CreatedAt { get; }

    public Reminder(
        Guid userId,
        Guid habitId,
        LocalTime localTime,
        string timezone,
        PushSubscriptionVo subscription,
        DateOnly? lastFiredDate,
        DateTime createdAt)
    {
        UserId = userId;
        HabitId = habitId;
        LocalTime = localTime;
        Timezone = timezone;
        Subscription = subscription;
        LastFiredDate = lastFiredDate;
        CreatedAt = createdAt;
    }

    public void UpdateScheduling(LocalTime localTime, string timezone, PushSubscriptionVo subscription)
    {
        LocalTime = localTime;
        Timezone = timezone;
        Subscription = subscription;
    }

    public void MarkFired(DateOnly localDate) => LastFiredDate = localDate;
}

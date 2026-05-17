namespace Reminders.Domain.ValueObjects;

/// <summary>
/// Web Push subscription credentials issued by the browser. Opaque to us.
/// </summary>
public sealed record PushSubscriptionVo(string Endpoint, string P256dh, string Auth);

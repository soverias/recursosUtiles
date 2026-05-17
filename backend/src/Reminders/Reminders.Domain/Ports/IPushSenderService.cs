using Reminders.Domain.ValueObjects;

namespace Reminders.Domain.Ports;

public enum PushSendResult
{
    Ok,
    Gone,        // 410: subscription invalid, delete
    Transient    // 5xx / timeout: keep, retry on next tick
}

public interface IPushSenderService
{
    Task<PushSendResult> SendAsync(PushSubscriptionVo subscription, string jsonPayload, CancellationToken ct = default);
}

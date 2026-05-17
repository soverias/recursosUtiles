using System.Net;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Reminders.Domain.Ports;
using Reminders.Domain.ValueObjects;
using Reminders.Infrastructure.Options;
using WebPush;

namespace Reminders.Infrastructure.Push;

public sealed class WebPushSenderService(
    IOptions<VapidOptions> options,
    ILogger<WebPushSenderService> logger) : IPushSenderService
{
    private readonly VapidOptions _vapid = options.Value;
    private readonly WebPushClient _client = new();

    public async Task<PushSendResult> SendAsync(
        PushSubscriptionVo subscription,
        string jsonPayload,
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_vapid.PublicKey) || string.IsNullOrEmpty(_vapid.PrivateKey))
        {
            logger.LogError("VAPID keys not configured — cannot send push.");
            return PushSendResult.Transient;
        }

        var pushSub = new PushSubscription(subscription.Endpoint, subscription.P256dh, subscription.Auth);
        var vapid = new VapidDetails(_vapid.Subject, _vapid.PublicKey, _vapid.PrivateKey);

        try
        {
            await _client.SendNotificationAsync(pushSub, jsonPayload, vapid, ct);
            return PushSendResult.Ok;
        }
        catch (WebPushException ex) when (ex.StatusCode == HttpStatusCode.Gone
                                       || ex.StatusCode == HttpStatusCode.NotFound)
        {
            logger.LogInformation("Subscription gone (endpoint {Endpoint}) — will be deleted.", subscription.Endpoint);
            return PushSendResult.Gone;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Transient push send failure for endpoint {Endpoint}.", subscription.Endpoint);
            return PushSendResult.Transient;
        }
    }
}

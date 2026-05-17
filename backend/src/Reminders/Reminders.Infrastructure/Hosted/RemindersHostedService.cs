using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Reminders.Domain.Entities;
using Reminders.Domain.Ports;

namespace Reminders.Infrastructure.Hosted;

/// <summary>
/// Self-scheduling cron: calculates the next firing UTC, sleeps until then,
/// processes due reminders, repeats. CRUD mutations Kick() the channel to
/// trigger early re-evaluation.
/// </summary>
public sealed class RemindersHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<RemindersHostedService> logger) : BackgroundService, IRemindersKicker
{
    private readonly Channel<bool> _kick = Channel.CreateUnbounded<bool>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

    private static readonly TimeSpan IdleFallback = TimeSpan.FromHours(1);

    public void Kick() => _kick.Writer.TryWrite(true);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("RemindersHostedService started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDueAsync(stoppingToken);
                await WaitUntilNextFiringOrKickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "RemindersHostedService loop error — backing off 30s.");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
        logger.LogInformation("RemindersHostedService stopped.");
    }

    private async Task WaitUntilNextFiringOrKickAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IReminderRepository>();
        var nextUtc = await repo.GetNextFiringUtcAsync(ct);

        var delay = nextUtc.HasValue
            ? nextUtc.Value - DateTime.UtcNow
            : IdleFallback;
        if (delay < TimeSpan.Zero) delay = TimeSpan.Zero;
        if (delay > IdleFallback) delay = IdleFallback;  // wake up periodically just in case

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        var sleep = Task.Delay(delay, cts.Token);
        var kick = _kick.Reader.WaitToReadAsync(ct).AsTask();

        await Task.WhenAny(sleep, kick);
        cts.Cancel();

        // Drain any pending kick signals so we don't loop instantly multiple times.
        while (_kick.Reader.TryRead(out _)) { }
    }

    private async Task ProcessDueAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IReminderRepository>();
        var sender = scope.ServiceProvider.GetRequiredService<IPushSenderService>();

        var due = await repo.GetDueAsync(ct);
        if (due.Count == 0) return;

        logger.LogInformation("Firing {Count} reminder(s).", due.Count);

        foreach (var reminder in due)
        {
            await SendOneAsync(reminder, repo, sender, ct);
        }
    }

    private static async Task SendOneAsync(
        Reminder reminder,
        IReminderRepository repo,
        IPushSenderService sender,
        CancellationToken ct)
    {
        var payload = JsonSerializer.Serialize(new
        {
            type = "reminder",
            habitId = reminder.HabitId
        });

        var result = await sender.SendAsync(reminder.Subscription, payload, ct);
        switch (result)
        {
            case PushSendResult.Ok:
                var localDate = LocalDateForTimezone(reminder.Timezone);
                await repo.MarkFiredAsync(reminder.UserId, reminder.HabitId, localDate, ct);
                break;
            case PushSendResult.Gone:
                await repo.DeleteAsync(reminder.UserId, reminder.HabitId, ct);
                break;
            case PushSendResult.Transient:
                // No-op: next iteration will retry.
                break;
        }
    }

    private static DateOnly LocalDateForTimezone(string timezone)
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(timezone);
            var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            return DateOnly.FromDateTime(local);
        }
        catch
        {
            return DateOnly.FromDateTime(DateTime.UtcNow);
        }
    }
}

namespace Reminders.Domain.Ports;

/// <summary>
/// Lightweight signal so use cases can wake the HostedService after a CRUD mutation,
/// triggering a re-evaluation of the next firing without coupling the application
/// layer to the infrastructure implementation.
/// </summary>
public interface IRemindersKicker
{
    void Kick();
}

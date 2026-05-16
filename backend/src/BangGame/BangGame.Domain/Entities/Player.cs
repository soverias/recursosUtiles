namespace BangGame.Domain.Entities;

public sealed class Player
{
    public string ConnectionId { get; }
    public string Username { get; }
    public Guid? UserId { get; }
    public bool IsGuest => !UserId.HasValue;

    public bool IsReady { get; private set; }
    public bool WantsRepeat { get; private set; }
    public bool HasTapped { get; private set; }

    public Player(string connectionId, string username, Guid? userId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(username);
        ConnectionId = connectionId;
        Username = username;
        UserId = userId;
    }

    internal void MarkReady() => IsReady = true;
    internal void MarkRepeat() => WantsRepeat = true;
    internal void MarkTapped() => HasTapped = true;

    internal void Reset()
    {
        IsReady = false;
        WantsRepeat = false;
        HasTapped = false;
    }
}

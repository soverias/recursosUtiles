namespace BangGame.Infrastructure.Matchmaking;

/// <summary>
/// Thread-safe in-memory matchmaking queue.
/// Uses a plain Queue with an explicit lock — drain-and-refill on Remove is O(n)
/// but acceptable at the scale of a real-time game lobby.
/// </summary>
public sealed class MatchmakingService
{
    private readonly Queue<MatchmakingEntry> _queue = new();
    private readonly object _lock = new();

    public void Enqueue(string connectionId, string username, Guid? userId)
    {
        lock (_lock) _queue.Enqueue(new MatchmakingEntry(connectionId, username, userId));
    }

    public void Remove(string connectionId)
    {
        lock (_lock)
        {
            var remaining = _queue.Where(e => e.ConnectionId != connectionId).ToList();
            _queue.Clear();
            foreach (var e in remaining) _queue.Enqueue(e);
        }
    }

    /// <summary>
    /// Dequeues two players for a match. Returns null if fewer than 2 are waiting.
    /// </summary>
    public (MatchmakingEntry First, MatchmakingEntry Second)? TryMatch()
    {
        lock (_lock)
        {
            if (_queue.Count < 2) return null;
            return (_queue.Dequeue(), _queue.Dequeue());
        }
    }

    public bool IsInQueue(string connectionId)
    {
        lock (_lock) return _queue.Any(e => e.ConnectionId == connectionId);
    }
}

public sealed record MatchmakingEntry(string ConnectionId, string Username, Guid? UserId);

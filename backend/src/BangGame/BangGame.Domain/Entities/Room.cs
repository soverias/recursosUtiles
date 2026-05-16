using BangGame.Domain.ValueObjects;
using RecursosUtiles.SharedKernel;

namespace BangGame.Domain.Entities;

/// <summary>
/// Aggregate root that owns all state for a Bang Game round.
/// All state transitions are protected by an internal lock — safe for concurrent Hub calls.
/// </summary>
public sealed class Room : Entity<string>
{
    private readonly object _lock = new();
    private readonly List<Player> _players = new(2);

    public RoomCode Code { get; }
    public bool IsPrivate { get; }
    public GamePhase Phase { get; private set; } = GamePhase.WaitingOpponent;
    public DateTime? BangTimestamp { get; private set; }
    public IReadOnlyList<Player> Players => _players.AsReadOnly();
    public bool IsFull => _players.Count >= 2;
    public bool IsEmpty => _players.Count == 0;

    public Room(string id, RoomCode code, bool isPrivate) : base(id)
    {
        Code = code;
        IsPrivate = isPrivate;
    }

    /// <summary>
    /// Adds a player to the room. Returns false if full.
    /// When the second player joins, transitions to WaitingReady.
    /// </summary>
    public bool TryAddPlayer(Player player)
    {
        lock (_lock)
        {
            if (_players.Count >= 2) return false;
            _players.Add(player);
            if (_players.Count == 2)
                Phase = GamePhase.WaitingReady;
            return true;
        }
    }

    /// <summary>Removes a player. Resets phase to WaitingOpponent.</summary>
    public bool RemovePlayer(string connectionId)
    {
        lock (_lock)
        {
            var player = _players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (player is null) return false;
            _players.Remove(player);
            Phase = GamePhase.WaitingOpponent;
            return true;
        }
    }

    /// <summary>
    /// Marks a player as ready. Returns true when both players are ready.
    /// </summary>
    public bool MarkReady(string connectionId)
    {
        lock (_lock)
        {
            var player = _players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (player is null || player.IsReady) return false;
            player.MarkReady();
            return _players.Count == 2 && _players.All(p => p.IsReady);
        }
    }

    /// <summary>
    /// Marks a player as wanting a rematch. Returns true when both want a rematch.
    /// </summary>
    public bool MarkRepeat(string connectionId)
    {
        lock (_lock)
        {
            var player = _players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (player is null || player.WantsRepeat) return false;
            player.MarkRepeat();
            return _players.Count == 2 && _players.All(p => p.WantsRepeat);
        }
    }

    /// <summary>Force-sets the phase. Used by the game loop for Countdown / WaitingBang.</summary>
    public void TransitionTo(GamePhase phase)
    {
        lock (_lock) { Phase = phase; }
    }

    /// <summary>Activates the Bang window and records the timestamp.</summary>
    public void SetBangActive(DateTime bangTimestamp)
    {
        lock (_lock)
        {
            Phase = GamePhase.BangActive;
            BangTimestamp = bangTimestamp;
        }
    }

    /// <summary>
    /// Processes a tap from a player. Returns a TapResult if the tap resolves the round;
    /// returns null if the tap is invalid (wrong phase, already tapped, player not found).
    ///
    /// False start: tap during Countdown or WaitingBang → tapper loses.
    /// Legitimate: tap during BangActive → tapper wins.
    /// Second tap: always ignored.
    /// </summary>
    public TapResult? ProcessTap(string connectionId, DateTime tapTime)
    {
        lock (_lock)
        {
            if (Phase is not (GamePhase.Countdown or GamePhase.WaitingBang or GamePhase.BangActive))
                return null;

            if (_players.Count < 2) return null;

            var tapper = _players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (tapper is null || tapper.HasTapped) return null;

            tapper.MarkTapped();

            bool isFalseStart = Phase is GamePhase.Countdown or GamePhase.WaitingBang;
            Phase = GamePhase.Result;

            var other = _players.First(p => p.ConnectionId != connectionId);

            int winnerReactionMs = (!isFalseStart && BangTimestamp.HasValue)
                ? Math.Max(0, (int)(tapTime - BangTimestamp.Value).TotalMilliseconds)
                : 0;

            var winner = isFalseStart ? other : tapper;
            var loser  = isFalseStart ? tapper : other;

            return new TapResult(winner, loser, winnerReactionMs, 0, isFalseStart);
        }
    }

    /// <summary>Resets state for a rematch. Both players become unready.</summary>
    public void ResetForNextRound()
    {
        lock (_lock)
        {
            foreach (var p in _players) p.Reset();
            Phase = GamePhase.WaitingReady;
            BangTimestamp = null;
        }
    }

    public Player? FindPlayer(string connectionId) =>
        _players.FirstOrDefault(p => p.ConnectionId == connectionId);

    public Player? GetOpponent(string connectionId) =>
        _players.FirstOrDefault(p => p.ConnectionId != connectionId);
}

using BangGame.Domain.Entities;
using BangGame.Domain.ValueObjects;
using Xunit;

namespace BangGame.Tests.Domain;

public sealed class RoomArbitratorTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Room CreateFullRoom(out Player p1, out Player p2)
    {
        var room = new Room(Guid.NewGuid().ToString(), RoomCode.Generate(), false);
        p1 = new Player("conn1", "Alice");
        p2 = new Player("conn2", "Bob");
        room.TryAddPlayer(p1);
        room.TryAddPlayer(p2);
        return room;
    }

    // ── False start ───────────────────────────────────────────────────────────

    [Theory]
    [InlineData(GamePhase.Countdown)]
    [InlineData(GamePhase.WaitingBang)]
    public void Tap_during_pre_bang_phase_is_a_false_start(GamePhase phase)
    {
        var room = CreateFullRoom(out var p1, out var p2);
        room.TransitionTo(phase);

        var result = room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);

        Assert.NotNull(result);
        Assert.True(result.IsFalseStart);
        Assert.Equal(p2.ConnectionId, result.Winner.ConnectionId); // tapper loses
        Assert.Equal(p1.ConnectionId, result.Loser.ConnectionId);
        Assert.Equal(0, result.WinnerReactionMs);
    }

    // ── Legitimate tap ────────────────────────────────────────────────────────

    [Fact]
    public void First_tap_during_BangActive_is_the_winner()
    {
        var room     = CreateFullRoom(out var p1, out var p2);
        var bangTime = DateTime.UtcNow.AddMilliseconds(-300);
        room.SetBangActive(bangTime);

        var result = room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);

        Assert.NotNull(result);
        Assert.False(result.IsFalseStart);
        Assert.Equal(p1.ConnectionId, result.Winner.ConnectionId);
        Assert.Equal(p2.ConnectionId, result.Loser.ConnectionId);
        Assert.True(result.WinnerReactionMs >= 0);
    }

    // ── Second tap is ignored ─────────────────────────────────────────────────

    [Fact]
    public void Second_tap_always_returns_null()
    {
        var room     = CreateFullRoom(out var p1, out var p2);
        var bangTime = DateTime.UtcNow.AddMilliseconds(-200);
        room.SetBangActive(bangTime);

        var first  = room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);
        var second = room.ProcessTap(p2.ConnectionId, DateTime.UtcNow);

        Assert.NotNull(first);
        Assert.Null(second);
        Assert.Equal(GamePhase.Result, room.Phase);
    }

    [Fact]
    public void Duplicate_tap_from_same_player_is_ignored()
    {
        var room = CreateFullRoom(out var p1, out _);
        room.SetBangActive(DateTime.UtcNow);

        var first  = room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);
        var second = room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);

        Assert.NotNull(first);
        Assert.Null(second);
    }

    // ── Tap outside active phases is ignored ──────────────────────────────────

    [Theory]
    [InlineData(GamePhase.WaitingOpponent)]
    [InlineData(GamePhase.WaitingReady)]
    [InlineData(GamePhase.Result)]
    public void Tap_during_inactive_phase_returns_null(GamePhase phase)
    {
        var room = CreateFullRoom(out var p1, out _);
        room.TransitionTo(phase);

        var result = room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);

        Assert.Null(result);
    }

    // ── Reaction time calculation ─────────────────────────────────────────────

    [Fact]
    public void ReactionMs_is_measured_from_bang_to_tap()
    {
        var room     = CreateFullRoom(out var p1, out _);
        var bangTime = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        room.SetBangActive(bangTime);

        var tapTime = bangTime.AddMilliseconds(250);
        var result  = room.ProcessTap(p1.ConnectionId, tapTime);

        Assert.NotNull(result);
        Assert.Equal(250, result.WinnerReactionMs);
    }

    [Fact]
    public void ReactionMs_is_never_negative()
    {
        var room     = CreateFullRoom(out var p1, out _);
        var bangTime = DateTime.UtcNow.AddMilliseconds(50); // bang "in the future"
        room.SetBangActive(bangTime);

        var result = room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);

        Assert.NotNull(result);
        Assert.True(result.WinnerReactionMs >= 0);
    }

    // ── Room lifecycle ────────────────────────────────────────────────────────

    [Fact]
    public void ResetForNextRound_clears_ready_and_tapped_flags()
    {
        var room = CreateFullRoom(out var p1, out var p2);
        room.SetBangActive(DateTime.UtcNow);
        room.ProcessTap(p1.ConnectionId, DateTime.UtcNow);

        room.ResetForNextRound();

        Assert.Equal(GamePhase.WaitingReady, room.Phase);
        Assert.False(room.Players[0].IsReady);
        Assert.False(room.Players[1].IsReady);
        Assert.False(room.Players[0].HasTapped);
    }

    [Fact]
    public void MarkReady_returns_true_only_when_both_ready()
    {
        var room = CreateFullRoom(out var p1, out var p2);

        var afterFirst  = room.MarkReady(p1.ConnectionId);
        var afterSecond = room.MarkReady(p2.ConnectionId);

        Assert.False(afterFirst);
        Assert.True(afterSecond);
    }
}

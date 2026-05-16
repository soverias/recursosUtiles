using BangGame.Infrastructure.Matchmaking;
using Xunit;

namespace BangGame.Tests.Infrastructure;

public sealed class MatchmakingServiceTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void One_player_in_queue_does_not_produce_a_match()
    {
        _sut.Enqueue("c1", "Alice", null);

        Assert.Null(_sut.TryMatch());
    }

    [Fact]
    public void Two_players_in_queue_produce_a_match_in_FIFO_order()
    {
        _sut.Enqueue("c1", "Alice", null);
        _sut.Enqueue("c2", "Bob",   null);

        var match = _sut.TryMatch();

        Assert.NotNull(match);
        Assert.Equal("c1", match.Value.First.ConnectionId);
        Assert.Equal("c2", match.Value.Second.ConnectionId);
    }

    [Fact]
    public void Queue_is_empty_after_a_match_is_made()
    {
        _sut.Enqueue("c1", "Alice", null);
        _sut.Enqueue("c2", "Bob",   null);
        _sut.TryMatch();

        Assert.Null(_sut.TryMatch());
    }

    [Fact]
    public void Third_player_has_to_wait_for_a_fourth()
    {
        _sut.Enqueue("c1", "Alice",   null);
        _sut.Enqueue("c2", "Bob",     null);
        _sut.Enqueue("c3", "Charlie", null);

        _sut.TryMatch(); // consumes c1 + c2
        Assert.Null(_sut.TryMatch()); // c3 alone — no match
    }

    [Fact]
    public void Remove_prevents_player_from_being_matched()
    {
        _sut.Enqueue("c1", "Alice", null);
        _sut.Remove("c1");
        _sut.Enqueue("c2", "Bob", null);

        Assert.Null(_sut.TryMatch());
    }

    [Fact]
    public void Remove_non_existing_connection_is_a_no_op()
    {
        _sut.Enqueue("c1", "Alice", null);
        _sut.Remove("not-in-queue"); // should not throw

        _sut.Enqueue("c2", "Bob", null);
        var match = _sut.TryMatch();
        Assert.NotNull(match);
    }

    [Fact]
    public void IsInQueue_reflects_enqueue_and_remove()
    {
        _sut.Enqueue("c1", "Alice", null);
        Assert.True(_sut.IsInQueue("c1"));

        _sut.Remove("c1");
        Assert.False(_sut.IsInQueue("c1"));
    }

    [Fact]
    public void IsInQueue_is_false_after_match_consumes_player()
    {
        _sut.Enqueue("c1", "Alice", null);
        _sut.Enqueue("c2", "Bob",   null);
        _sut.TryMatch();

        Assert.False(_sut.IsInQueue("c1"));
        Assert.False(_sut.IsInQueue("c2"));
    }
}

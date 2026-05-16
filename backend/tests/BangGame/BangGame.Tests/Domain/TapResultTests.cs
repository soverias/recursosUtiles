using BangGame.Domain.Entities;
using Xunit;

namespace BangGame.Tests.Domain;

public sealed class TapResultTests
{
    private static Player Registered(string username) =>
        new("conn-" + username, username, Guid.NewGuid());

    private static Player Guest(string username) =>
        new("conn-" + username, username);

    [Fact]
    public void ShouldPersist_is_true_when_both_players_are_registered()
    {
        var result = new TapResult(Registered("Alice"), Registered("Bob"), 250, 0, false);

        Assert.True(result.ShouldPersist);
    }

    [Fact]
    public void ShouldPersist_is_false_when_winner_is_guest()
    {
        var result = new TapResult(Guest("Invitado_AB12"), Registered("Bob"), 250, 0, false);

        Assert.False(result.ShouldPersist);
    }

    [Fact]
    public void ShouldPersist_is_false_when_loser_is_guest()
    {
        var result = new TapResult(Registered("Alice"), Guest("Invitado_CD34"), 250, 0, false);

        Assert.False(result.ShouldPersist);
    }

    [Fact]
    public void ShouldPersist_is_false_when_both_players_are_guests()
    {
        var result = new TapResult(Guest("Invitado_AB12"), Guest("Invitado_CD34"), 250, 0, false);

        Assert.False(result.ShouldPersist);
    }

    [Fact]
    public void ShouldPersist_does_not_depend_on_false_start()
    {
        var falseStart = new TapResult(Registered("Alice"), Registered("Bob"), 0, 0, true);
        var legitimate = new TapResult(Registered("Alice"), Registered("Bob"), 250, 0, false);

        Assert.True(falseStart.ShouldPersist);
        Assert.True(legitimate.ShouldPersist);
    }
}

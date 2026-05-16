using BangGame.Application.UseCases;
using BangGame.Domain.Ports;
using NSubstitute;
using Xunit;

namespace BangGame.Tests.Application;

public sealed class GetRankingUseCaseTests
{
    private readonly IGameResultRepository _repo = Substitute.For<IGameResultRepository>();
    private readonly GetRankingUseCase _sut;

    public GetRankingUseCaseTests() => _sut = new GetRankingUseCase(_repo);

    [Fact]
    public async Task Returns_success_and_maps_all_fields()
    {
        var entries = new List<RankingEntry>
        {
            new("Alice", 10, 150.5, 0.83)
        };
        _repo.GetRankingAsync(default).ReturnsForAnyArgs(entries.AsReadOnly());

        var result = await _sut.ExecuteAsync();

        Assert.True(result.IsSuccess);
        var item = Assert.Single(result.Value);
        Assert.Equal("Alice", item.Username);
        Assert.Equal(10,      item.Wins);
        Assert.Equal(150.5,   item.AvgReactionMs);
        Assert.Equal(0.83,    item.WinRatio);
    }

    [Fact]
    public async Task Returns_empty_list_when_no_game_results()
    {
        _repo.GetRankingAsync(default).ReturnsForAnyArgs(
            (IReadOnlyList<RankingEntry>)Array.Empty<RankingEntry>());

        var result = await _sut.ExecuteAsync();

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value);
    }

    [Fact]
    public async Task Preserves_repository_ordering()
    {
        // The repository (SQL) handles ordering; the use case must not reorder
        var entries = new List<RankingEntry>
        {
            new("Charlie", 5,  280.0, 0.71),
            new("Alice",   10, 150.5, 0.83),
            new("Bob",     3,  320.0, 0.60)
        };
        _repo.GetRankingAsync(default).ReturnsForAnyArgs(entries.AsReadOnly());

        var result = await _sut.ExecuteAsync();

        Assert.Equal(new[] { "Charlie", "Alice", "Bob" },
                     result.Value.Select(r => r.Username));
    }

    [Fact]
    public async Task WinRatio_is_passed_through_unchanged()
    {
        double expected = 2.0 / 3.0;
        var entries = new List<RankingEntry> { new("Alice", 2, 200.0, expected) };
        _repo.GetRankingAsync(default).ReturnsForAnyArgs(entries.AsReadOnly());

        var result = await _sut.ExecuteAsync();

        Assert.Equal(expected, result.Value[0].WinRatio, precision: 15);
    }

    [Fact]
    public async Task Multiple_players_are_all_returned()
    {
        var entries = Enumerable.Range(1, 5)
            .Select(i => new RankingEntry($"Player{i}", i * 2, i * 100.0, 0.5))
            .ToList();
        _repo.GetRankingAsync(default).ReturnsForAnyArgs(entries.AsReadOnly());

        var result = await _sut.ExecuteAsync();

        Assert.Equal(5, result.Value.Count);
    }
}

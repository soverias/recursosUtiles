using BangGame.Domain.Entities;

namespace BangGame.Domain.Ports;

public interface IGameResultRepository
{
    Task AddAsync(GameResult result, CancellationToken ct = default);
    Task<IReadOnlyList<RankingEntry>> GetRankingAsync(CancellationToken ct = default);
}

/// <summary>Projection returned by the ranking query.</summary>
public sealed record RankingEntry(
    string Username,
    int Wins,
    double AvgReactionMs,
    double WinRatio
);

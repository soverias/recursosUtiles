using BangGame.Application.DTOs;
using BangGame.Domain.Ports;
using RecursosUtiles.SharedKernel;

namespace BangGame.Application.UseCases;

public sealed class GetRankingUseCase(IGameResultRepository results)
{
    public async Task<Result<IReadOnlyList<RankingItemDto>>> ExecuteAsync(CancellationToken ct = default)
    {
        var entries = await results.GetRankingAsync(ct);

        var dtos = entries
            .Select(e => new RankingItemDto(e.Username, e.Wins, e.AvgReactionMs, e.WinRatio))
            .ToList();

        return Result.Success<IReadOnlyList<RankingItemDto>>(dtos);
    }
}

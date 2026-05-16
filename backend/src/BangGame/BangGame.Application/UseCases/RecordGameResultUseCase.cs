using BangGame.Domain.Entities;
using BangGame.Domain.Ports;
using RecursosUtiles.SharedKernel;

namespace BangGame.Application.UseCases;

public sealed record RecordGameResultCommand(
    Guid WinnerId,
    Guid LoserId,
    int WinnerReactionMs,
    int LoserReactionMs,
    bool IsFalseStart
);

public sealed class RecordGameResultUseCase(IGameResultRepository results)
{
    public async Task<Result> ExecuteAsync(RecordGameResultCommand cmd, CancellationToken ct = default)
    {
        var result = new GameResult(
            Guid.NewGuid(),
            cmd.WinnerId,
            cmd.LoserId,
            cmd.WinnerReactionMs,
            cmd.LoserReactionMs,
            cmd.IsFalseStart,
            DateTime.UtcNow);

        await results.AddAsync(result, ct);
        return Result.Success();
    }
}

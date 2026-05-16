using RecursosUtiles.SharedKernel;

namespace BangGame.Domain.Entities;

public sealed class GameResult : Entity<Guid>
{
    public Guid WinnerId { get; }
    public Guid LoserId { get; }
    public int WinnerReactionMs { get; }
    public int LoserReactionMs { get; }
    public bool IsFalseStart { get; }
    public DateTime PlayedAt { get; }

    public GameResult(
        Guid id,
        Guid winnerId,
        Guid loserId,
        int winnerReactionMs,
        int loserReactionMs,
        bool isFalseStart,
        DateTime playedAt)
        : base(id)
    {
        WinnerId = winnerId;
        LoserId = loserId;
        WinnerReactionMs = winnerReactionMs;
        LoserReactionMs = loserReactionMs;
        IsFalseStart = isFalseStart;
        PlayedAt = playedAt;
    }
}

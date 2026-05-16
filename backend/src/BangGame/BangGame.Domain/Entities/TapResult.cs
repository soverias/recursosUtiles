namespace BangGame.Domain.Entities;

public sealed record TapResult(
    Player Winner,
    Player Loser,
    int WinnerReactionMs,
    int LoserReactionMs,
    bool IsFalseStart
)
{
    public bool ShouldPersist => !Winner.IsGuest && !Loser.IsGuest;
}

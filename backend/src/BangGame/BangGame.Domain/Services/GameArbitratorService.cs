using BangGame.Domain.ValueObjects;

namespace BangGame.Domain.Services;

/// <summary>
/// Pure domain service encapsulating arbitration rules.
/// All methods are static and side-effect free — testable without infrastructure.
/// The actual state mutation lives in <see cref="Entities.Room.ProcessTap"/>.
/// </summary>
public static class GameArbitratorService
{
    /// <summary>Returns true when a tap in the given phase is a false start.</summary>
    public static bool IsFalseStart(GamePhase phase) =>
        phase is GamePhase.Countdown or GamePhase.WaitingBang;

    /// <summary>Calculates milliseconds between Bang and tap. Always non-negative.</summary>
    public static int CalculateReactionMs(DateTime bangTimestamp, DateTime tapTime) =>
        Math.Max(0, (int)(tapTime - bangTimestamp).TotalMilliseconds);
}

namespace BangGame.Application.DTOs;

public sealed record RankingItemDto(
    string Username,
    int Wins,
    double AvgReactionMs,
    double WinRatio
);

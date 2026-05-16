using BangGame.Application.UseCases;
using Microsoft.AspNetCore.Mvc;

namespace RecursosUtiles.Api.Controllers.BangGame;

[ApiController]
[Route("ranking")]
public sealed class RankingController(GetRankingUseCase getRanking) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await getRanking.ExecuteAsync(ct);
        return Ok(result.Value);
    }
}

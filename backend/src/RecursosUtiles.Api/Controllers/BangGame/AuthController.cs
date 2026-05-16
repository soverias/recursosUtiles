using BangGame.Application.DTOs;
using BangGame.Application.UseCases;
using Microsoft.AspNetCore.Mvc;

namespace RecursosUtiles.Api.Controllers.BangGame;

[ApiController]
[Route("auth")]
public sealed class AuthController(
    RegisterUserUseCase register,
    LoginUserUseCase    login) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await register.ExecuteAsync(request, ct);
        if (result.IsFailure)
            return Conflict(new { error = result.Error.Description });
        return StatusCode(201, result.Value);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await login.ExecuteAsync(request, ct);
        if (result.IsFailure)
            return Unauthorized(new { error = result.Error.Description });
        return Ok(result.Value);
    }
}

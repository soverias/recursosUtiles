using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Reminders.Application.DTOs;
using Reminders.Application.UseCases;

namespace RecursosUtiles.Api.Controllers.Reminders;

[ApiController]
[Authorize]
[Route("api/reminders")]
public sealed class RemindersController(
    ListUserRemindersUseCase list,
    UpsertReminderUseCase upsert,
    DeleteReminderUseCase delete) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var items = await list.ExecuteAsync(userId, ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertReminderRequest request, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var result = await upsert.ExecuteAsync(userId, request, ct);
        return result.IsFailure
            ? BadRequest(new { error = result.Error.Description })
            : StatusCode(201, result.Value);
    }

    [HttpDelete("{habitId:guid}")]
    public async Task<IActionResult> Delete(Guid habitId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var result = await delete.ExecuteAsync(userId, habitId, ct);
        return result.IsFailure
            ? NotFound(new { error = result.Error.Description })
            : NoContent();
    }

    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out userId);
    }
}

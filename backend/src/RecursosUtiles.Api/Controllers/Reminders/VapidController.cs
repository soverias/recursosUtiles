using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Reminders.Application.DTOs;
using Reminders.Infrastructure.Options;

namespace RecursosUtiles.Api.Controllers.Reminders;

[ApiController]
[AllowAnonymous]
[Route("api/reminders/vapid-public-key")]
public sealed class VapidController(IOptions<VapidOptions> options) : ControllerBase
{
    private readonly VapidOptions _vapid = options.Value;

    [HttpGet]
    public IActionResult Get()
    {
        if (string.IsNullOrEmpty(_vapid.PublicKey))
            return StatusCode(503, new { error = "VAPID public key not configured on server" });

        return Ok(new VapidPublicKeyResponse(_vapid.PublicKey));
    }
}

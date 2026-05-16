using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BangGame.Application.Ports;
using BangGame.Domain.Entities;
using BangGame.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BangGame.Infrastructure.Auth;

public sealed class JwtService(IOptions<JwtOptions> options) : IJwtService
{
    private readonly JwtOptions _opts = options.Value;

    public string GenerateToken(User user)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,        user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.NameIdentifier,          user.Id.ToString()),
            new Claim(ClaimTypes.Name,                    user.Username)
        };

        var token = new JwtSecurityToken(
            issuer:            _opts.Issuer,
            audience:          _opts.Audience,
            claims:            claims,
            expires:           DateTime.UtcNow.AddMinutes(_opts.ExpirationMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

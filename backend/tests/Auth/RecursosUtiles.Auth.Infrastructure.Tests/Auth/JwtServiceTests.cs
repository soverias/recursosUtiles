using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RecursosUtiles.Auth.Domain.Entities;
using RecursosUtiles.Auth.Infrastructure.Auth;
using RecursosUtiles.Auth.Infrastructure.Options;

namespace RecursosUtiles.Auth.Infrastructure.Tests.Auth;

public sealed class JwtServiceTests
{
    private const string SecretKey = "test-secret-key-must-be-at-least-32-chars-long";
    private const string Issuer = "TestIssuer";
    private const string Audience = "TestAudience";

    private readonly JwtService _sut;
    private readonly User _user = new(Guid.NewGuid(), "alice", "irrelevant-hash");

    public JwtServiceTests()
    {
        var opts = new JwtOptions
        {
            SecretKey = SecretKey,
            Issuer = Issuer,
            Audience = Audience,
            ExpirationMinutes = 60
        };
        _sut = new JwtService(Microsoft.Extensions.Options.Options.Create(opts));
    }

    [Fact]
    public void Generates_token_with_configured_issuer_and_audience()
    {
        var token = _sut.GenerateToken(_user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Issuer.Should().Be(Issuer);
        jwt.Audiences.Should().Contain(Audience);
    }

    [Fact]
    public void Token_contains_user_id_and_username_claims()
    {
        var token = _sut.GenerateToken(_user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Claims.Should().Contain(c =>
            c.Type == JwtRegisteredClaimNames.Sub && c.Value == _user.Id.ToString());
        jwt.Claims.Should().Contain(c =>
            c.Type == JwtRegisteredClaimNames.UniqueName && c.Value == _user.Username);
    }

    [Fact]
    public void Token_is_signed_with_HS256_and_verifiable_with_secret()
    {
        var token = _sut.GenerateToken(_user);

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey)),
            ValidateLifetime = true
        };

        var handler = new JwtSecurityTokenHandler();
        var act = () => handler.ValidateToken(token, parameters, out _);
        act.Should().NotThrow();

        var jwt = handler.ReadJwtToken(token);
        jwt.Header.Alg.Should().Be(SecurityAlgorithms.HmacSha256);
    }
}

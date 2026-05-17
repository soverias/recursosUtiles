namespace RecursosUtiles.Auth.Infrastructure.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; init; } = string.Empty;
    public string Issuer { get; init; } = "RecursosUtiles";
    public string Audience { get; init; } = "RecursosUtiles";
    public int ExpirationMinutes { get; init; } = 1440;
}

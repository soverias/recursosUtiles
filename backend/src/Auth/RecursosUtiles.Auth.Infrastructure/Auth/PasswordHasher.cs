using System.Security.Cryptography;
using RecursosUtiles.Auth.Application.Ports;

namespace RecursosUtiles.Auth.Infrastructure.Auth;

/// <summary>PBKDF2-SHA256 password hasher. No external dependencies.</summary>
public sealed class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 100_000;
    private const int KeySize = 32;
    private const char Separator = ':';

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, KeySize);
        return $"{Convert.ToBase64String(salt)}{Separator}{Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string storedHash)
    {
        var parts = storedHash.Split(Separator, 2);
        if (parts.Length != 2) return false;

        byte[] salt, expected;
        try
        {
            salt     = Convert.FromBase64String(parts[0]);
            expected = Convert.FromBase64String(parts[1]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, KeySize);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}

using RecursosUtiles.SharedKernel;

namespace BangGame.Domain.ValueObjects;

public sealed class RoomCode : ValueObject
{
    private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public string Value { get; }

    public RoomCode(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        if (value.Length != 6)
            throw new ArgumentException("Room code must be exactly 6 characters.", nameof(value));
        Value = value.ToUpperInvariant();
    }

    public static RoomCode Generate()
    {
        var code = new string(Enumerable.Range(0, 6)
            .Select(_ => Alphabet[Random.Shared.Next(Alphabet.Length)])
            .ToArray());
        return new RoomCode(code);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}

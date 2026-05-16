using BangGame.Domain.ValueObjects;
using Xunit;

namespace BangGame.Tests.Domain;

public sealed class RoomCodeTests
{
    [Fact]
    public void Generate_produces_a_6_character_code()
    {
        var code = RoomCode.Generate();

        Assert.Equal(6, code.Value.Length);
    }

    [Fact]
    public void Generate_produces_only_uppercase_alphanumeric_characters()
    {
        for (var i = 0; i < 1_000; i++)
        {
            var code = RoomCode.Generate();
            Assert.Matches("^[A-Z0-9]{6}$", code.Value);
        }
    }

    [Fact]
    public void Generate_produces_distinct_codes_across_many_calls()
    {
        // The code space is 36^6 ≈ 2.18B. Generating 10k codes should hit
        // zero collisions with overwhelming probability. A failure here means
        // either the RNG is broken or the alphabet collapsed.
        const int sampleSize = 10_000;
        var codes = new HashSet<string>(sampleSize);

        for (var i = 0; i < sampleSize; i++)
            codes.Add(RoomCode.Generate().Value);

        Assert.Equal(sampleSize, codes.Count);
    }

    [Fact]
    public void Constructor_rejects_codes_of_wrong_length()
    {
        Assert.Throws<ArgumentException>(() => new RoomCode("ABCDE"));   // 5
        Assert.Throws<ArgumentException>(() => new RoomCode("ABCDEFG")); // 7
    }

    [Fact]
    public void Constructor_normalizes_to_uppercase()
    {
        var code = new RoomCode("abc123");

        Assert.Equal("ABC123", code.Value);
    }
}

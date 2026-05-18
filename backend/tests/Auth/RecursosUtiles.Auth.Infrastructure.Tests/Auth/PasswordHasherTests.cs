using FluentAssertions;
using RecursosUtiles.Auth.Infrastructure.Auth;

namespace RecursosUtiles.Auth.Infrastructure.Tests.Auth;

public sealed class PasswordHasherTests
{
    private readonly PasswordHasher _sut = new();

    [Fact]
    public void Hash_produces_different_outputs_for_same_input()
    {
        var h1 = _sut.Hash("password123");
        var h2 = _sut.Hash("password123");

        h1.Should().NotBe(h2);
        h1.Should().Contain(":");
        h2.Should().Contain(":");
    }

    [Fact]
    public void Verify_returns_true_for_matching_password()
    {
        var hash = _sut.Hash("password123");

        _sut.Verify("password123", hash).Should().BeTrue();
    }

    [Fact]
    public void Verify_returns_false_for_wrong_password()
    {
        var hash = _sut.Hash("password123");

        _sut.Verify("WRONG", hash).Should().BeFalse();
    }
}

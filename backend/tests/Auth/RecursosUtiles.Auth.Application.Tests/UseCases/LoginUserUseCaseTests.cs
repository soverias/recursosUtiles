using FluentAssertions;
using NSubstitute;
using RecursosUtiles.Auth.Application.DTOs;
using RecursosUtiles.Auth.Application.Ports;
using RecursosUtiles.Auth.Application.UseCases;
using RecursosUtiles.Auth.Domain.Entities;
using RecursosUtiles.Auth.Domain.Ports;

namespace RecursosUtiles.Auth.Application.Tests.UseCases;

public sealed class LoginUserUseCaseTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtService _jwt = Substitute.For<IJwtService>();
    private readonly LoginUserUseCase _sut;

    public LoginUserUseCaseTests()
    {
        _sut = new LoginUserUseCase(_users, _hasher, _jwt);
    }

    [Fact]
    public async Task Returns_success_with_token_when_credentials_are_valid()
    {
        var request = new LoginRequest("alice", "plaintext-password");
        var existing = new User(Guid.NewGuid(), "alice", "hashed");
        _users.FindByUsernameAsync("alice", Arg.Any<CancellationToken>()).Returns(existing);
        _hasher.Verify("plaintext-password", "hashed").Returns(true);
        _jwt.GenerateToken(existing).Returns("jwt-token");

        var result = await _sut.ExecuteAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value.Token.Should().Be("jwt-token");
        result.Value.Username.Should().Be("alice");
    }

    [Fact]
    public async Task Returns_invalid_credentials_when_user_not_found()
    {
        var request = new LoginRequest("ghost", "any-password");
        _users.FindByUsernameAsync("ghost", Arg.Any<CancellationToken>()).Returns((User?)null);

        var result = await _sut.ExecuteAsync(request);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.InvalidCredentials");
        // Production uses short-circuit `||`, so Verify is NOT called when user is null.
        _hasher.DidNotReceive().Verify(Arg.Any<string>(), Arg.Any<string>());
    }

    [Fact]
    public async Task Returns_invalid_credentials_when_password_is_wrong()
    {
        var request = new LoginRequest("alice", "wrong-password");
        var existing = new User(Guid.NewGuid(), "alice", "hashed");
        _users.FindByUsernameAsync("alice", Arg.Any<CancellationToken>()).Returns(existing);
        _hasher.Verify("wrong-password", "hashed").Returns(false);

        var result = await _sut.ExecuteAsync(request);

        result.IsFailure.Should().BeTrue();
        // Same error code as user-not-found, intentional anti-enumeration.
        result.Error.Code.Should().Be("Auth.InvalidCredentials");
    }
}

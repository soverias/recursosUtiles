using FluentAssertions;
using NSubstitute;
using RecursosUtiles.Auth.Application.DTOs;
using RecursosUtiles.Auth.Application.Ports;
using RecursosUtiles.Auth.Application.UseCases;
using RecursosUtiles.Auth.Domain.Entities;
using RecursosUtiles.Auth.Domain.Ports;

namespace RecursosUtiles.Auth.Application.Tests.UseCases;

public sealed class RegisterUserUseCaseTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtService _jwt = Substitute.For<IJwtService>();
    private readonly RegisterUserUseCase _sut;

    public RegisterUserUseCaseTests()
    {
        _sut = new RegisterUserUseCase(_users, _hasher, _jwt);
    }

    [Fact]
    public async Task Returns_success_with_token_when_username_is_available()
    {
        var request = new RegisterRequest("alice", "plaintext-password");
        _users.ExistsAsync("alice", Arg.Any<CancellationToken>()).Returns(false);
        _hasher.Hash("plaintext-password").Returns("hashed-password");
        _jwt.GenerateToken(Arg.Any<User>()).Returns("jwt-token");

        var result = await _sut.ExecuteAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value.Token.Should().Be("jwt-token");
        result.Value.Username.Should().Be("alice");
        await _users.Received(1).AddAsync(
            Arg.Is<User>(u => u.PasswordHash == "hashed-password"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Returns_conflict_when_username_already_exists()
    {
        var request = new RegisterRequest("alice", "plaintext-password");
        _users.ExistsAsync("alice", Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.ExecuteAsync(request);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.UsernameConflict");
        await _users.DidNotReceive().AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
        _jwt.DidNotReceive().GenerateToken(Arg.Any<User>());
    }

    [Fact]
    public async Task Persists_user_with_hashed_password()
    {
        var request = new RegisterRequest("alice", "plaintext-password");
        _users.ExistsAsync("alice", Arg.Any<CancellationToken>()).Returns(false);
        _hasher.Hash("plaintext-password").Returns("hashed-password");
        _jwt.GenerateToken(Arg.Any<User>()).Returns("jwt-token");

        User? captured = null;
        await _users.AddAsync(
            Arg.Do<User>(u => captured = u),
            Arg.Any<CancellationToken>());

        await _sut.ExecuteAsync(request);

        captured.Should().NotBeNull();
        captured!.PasswordHash.Should().Be("hashed-password");
        captured.PasswordHash.Should().NotBe("plaintext-password");
        captured.Username.Should().Be("alice");
    }
}

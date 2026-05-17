using RecursosUtiles.Auth.Application.DTOs;
using RecursosUtiles.Auth.Application.Ports;
using RecursosUtiles.Auth.Domain.Entities;
using RecursosUtiles.Auth.Domain.Ports;
using RecursosUtiles.SharedKernel;

namespace RecursosUtiles.Auth.Application.UseCases;

public sealed class RegisterUserUseCase(
    IUserRepository users,
    IPasswordHasher hasher,
    IJwtService jwt)
{
    public async Task<Result<AuthResponse>> ExecuteAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (await users.ExistsAsync(request.Username, ct))
            return Result.Failure<AuthResponse>(
                Error.Conflict("Auth.UsernameConflict", "Username no disponible"));

        var user = new User(Guid.NewGuid(), request.Username, hasher.Hash(request.Password));
        await users.AddAsync(user, ct);

        return Result.Success(new AuthResponse(jwt.GenerateToken(user), user.Username));
    }
}

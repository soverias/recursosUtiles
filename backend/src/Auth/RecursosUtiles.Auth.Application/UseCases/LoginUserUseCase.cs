using RecursosUtiles.Auth.Application.DTOs;
using RecursosUtiles.Auth.Application.Ports;
using RecursosUtiles.Auth.Domain.Ports;
using RecursosUtiles.SharedKernel;

namespace RecursosUtiles.Auth.Application.UseCases;

public sealed class LoginUserUseCase(
    IUserRepository users,
    IPasswordHasher hasher,
    IJwtService jwt)
{
    public async Task<Result<AuthResponse>> ExecuteAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await users.FindByUsernameAsync(request.Username, ct);

        if (user is null || !hasher.Verify(request.Password, user.PasswordHash))
            return Result.Failure<AuthResponse>(
                Error.Validation("Auth.InvalidCredentials", "Credenciales inválidas"));

        return Result.Success(new AuthResponse(jwt.GenerateToken(user), user.Username));
    }
}

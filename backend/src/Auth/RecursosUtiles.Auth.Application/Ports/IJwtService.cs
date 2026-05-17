using RecursosUtiles.Auth.Domain.Entities;

namespace RecursosUtiles.Auth.Application.Ports;

public interface IJwtService
{
    string GenerateToken(User user);
}

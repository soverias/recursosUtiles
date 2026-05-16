using BangGame.Domain.Entities;

namespace BangGame.Application.Ports;

public interface IJwtService
{
    string GenerateToken(User user);
}

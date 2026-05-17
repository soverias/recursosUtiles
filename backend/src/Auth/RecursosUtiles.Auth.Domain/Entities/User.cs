using RecursosUtiles.SharedKernel;

namespace RecursosUtiles.Auth.Domain.Entities;

public sealed class User : Entity<Guid>
{
    public string Username { get; }
    public string PasswordHash { get; }
    public bool IsGuest { get; }

    public User(Guid id, string username, string passwordHash, bool isGuest = false)
        : base(id)
    {
        Username = username;
        PasswordHash = passwordHash;
        IsGuest = isGuest;
    }
}

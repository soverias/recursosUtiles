using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RecursosUtiles.Auth.Application.Ports;
using RecursosUtiles.Auth.Application.UseCases;
using RecursosUtiles.Auth.Domain.Ports;
using RecursosUtiles.Auth.Infrastructure.Auth;
using RecursosUtiles.Auth.Infrastructure.Options;
using RecursosUtiles.Auth.Infrastructure.Persistence;

namespace RecursosUtiles.Auth.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAuth(this IServiceCollection services, IConfiguration config)
    {
        var jwtSection = config.GetSection(JwtOptions.SectionName);
        var jwtOpts = new JwtOptions
        {
            SecretKey         = jwtSection["SecretKey"]         ?? string.Empty,
            Issuer            = jwtSection["Issuer"]            ?? "RecursosUtiles",
            Audience          = jwtSection["Audience"]          ?? "RecursosUtiles",
            ExpirationMinutes = int.TryParse(jwtSection["ExpirationMinutes"], out var m) ? m : 1440
        };
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(jwtOpts));

        var cs = config.GetConnectionString("DefaultConnection")
                 ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required.");
        services.AddSingleton(new DbConnectionFactory(cs));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        services.AddScoped<RegisterUserUseCase>();
        services.AddScoped<LoginUserUseCase>();

        return services;
    }
}

using BangGame.Application.Ports;
using BangGame.Application.UseCases;
using BangGame.Domain.Ports;
using BangGame.Infrastructure.Auth;
using BangGame.Infrastructure.Matchmaking;
using BangGame.Infrastructure.Options;
using BangGame.Infrastructure.Persistence;
using BangGame.Infrastructure.RoomManager;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BangGame.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBangGame(this IServiceCollection services, IConfiguration config)
    {
        // Options — register a pre-built instance to avoid needing ConfigurationBinder
        var jwtSection = config.GetSection(JwtOptions.SectionName);
        var jwtOpts = new JwtOptions
        {
            SecretKey         = jwtSection["SecretKey"]         ?? string.Empty,
            Issuer            = jwtSection["Issuer"]            ?? "RecursosUtiles",
            Audience          = jwtSection["Audience"]          ?? "RecursosUtiles",
            ExpirationMinutes = int.TryParse(jwtSection["ExpirationMinutes"], out var m) ? m : 1440
        };
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(jwtOpts));

        // Persistence
        var cs = config.GetConnectionString("DefaultConnection")
                 ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required.");
        services.AddSingleton(new DbConnectionFactory(cs));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IGameResultRepository, GameResultRepository>();

        // Auth
        services.AddScoped<IJwtService, JwtService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        // In-memory services — singleton so they survive across Hub invocations
        services.AddSingleton<MatchmakingService>();
        services.AddSingleton<RoomService>();

        // Use cases
        services.AddScoped<RegisterUserUseCase>();
        services.AddScoped<LoginUserUseCase>();
        services.AddScoped<GetRankingUseCase>();
        services.AddScoped<RecordGameResultUseCase>();

        return services;
    }
}

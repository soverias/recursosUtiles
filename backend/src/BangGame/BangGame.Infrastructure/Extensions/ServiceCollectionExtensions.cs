using BangGame.Application.UseCases;
using BangGame.Domain.Ports;
using BangGame.Infrastructure.Matchmaking;
using BangGame.Infrastructure.Persistence;
using BangGame.Infrastructure.RoomManager;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BangGame.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBangGame(this IServiceCollection services, IConfiguration config)
    {
        // Persistence
        var cs = config.GetConnectionString("DefaultConnection")
                 ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required.");
        services.AddSingleton(new DbConnectionFactory(cs));
        services.AddScoped<IGameResultRepository, GameResultRepository>();

        // In-memory services — singleton so they survive across Hub invocations
        services.AddSingleton<MatchmakingService>();
        services.AddSingleton<RoomService>();

        // Use cases
        services.AddScoped<GetRankingUseCase>();
        services.AddScoped<RecordGameResultUseCase>();

        return services;
    }
}

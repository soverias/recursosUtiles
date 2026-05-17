using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Reminders.Application.UseCases;
using Reminders.Domain.Ports;
using Reminders.Infrastructure.Hosted;
using Reminders.Infrastructure.Options;
using Reminders.Infrastructure.Persistence;
using Reminders.Infrastructure.Push;

namespace Reminders.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddReminders(this IServiceCollection services, IConfiguration config)
    {
        // VAPID options
        var vapidSection = config.GetSection(VapidOptions.SectionName);
        var vapidOpts = new VapidOptions
        {
            PublicKey  = vapidSection["PublicKey"]  ?? string.Empty,
            PrivateKey = vapidSection["PrivateKey"] ?? string.Empty,
            Subject    = vapidSection["Subject"]    ?? string.Empty
        };
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(vapidOpts));

        // Persistence — Reminders has its own DbConnectionFactory instance
        // (intentional: each module is self-contained).
        var cs = config.GetConnectionString("DefaultConnection")
                 ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required.");
        services.AddSingleton(new DbConnectionFactory(cs));
        services.AddScoped<IReminderRepository, ReminderRepository>();

        // Push sender
        services.AddSingleton<IPushSenderService, WebPushSenderService>();

        // Hosted service: registered as singleton AND as hosted service AND as IRemindersKicker.
        // Use AddSingleton + AddHostedService(provider => provider.GetRequiredService<T>())
        // so that injecting IRemindersKicker into a use case returns the SAME instance.
        services.AddSingleton<RemindersHostedService>();
        services.AddSingleton<IRemindersKicker>(sp => sp.GetRequiredService<RemindersHostedService>());
        services.AddHostedService(sp => sp.GetRequiredService<RemindersHostedService>());

        // Use cases
        services.AddScoped<ListUserRemindersUseCase>();
        services.AddScoped<UpsertReminderUseCase>();
        services.AddScoped<DeleteReminderUseCase>();

        return services;
    }
}

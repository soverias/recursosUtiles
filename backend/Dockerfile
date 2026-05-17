# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files first for layered restore caching
COPY ["src/RecursosUtiles.Api/RecursosUtiles.Api.csproj",                                 "src/RecursosUtiles.Api/"]
COPY ["src/RecursosUtiles.SharedKernel/RecursosUtiles.SharedKernel.csproj",               "src/RecursosUtiles.SharedKernel/"]
COPY ["src/Auth/RecursosUtiles.Auth.Domain/RecursosUtiles.Auth.Domain.csproj",            "src/Auth/RecursosUtiles.Auth.Domain/"]
COPY ["src/Auth/RecursosUtiles.Auth.Application/RecursosUtiles.Auth.Application.csproj",  "src/Auth/RecursosUtiles.Auth.Application/"]
COPY ["src/Auth/RecursosUtiles.Auth.Infrastructure/RecursosUtiles.Auth.Infrastructure.csproj", "src/Auth/RecursosUtiles.Auth.Infrastructure/"]
COPY ["src/BangGame/BangGame.Domain/BangGame.Domain.csproj",                              "src/BangGame/BangGame.Domain/"]
COPY ["src/BangGame/BangGame.Application/BangGame.Application.csproj",                    "src/BangGame/BangGame.Application/"]
COPY ["src/BangGame/BangGame.Infrastructure/BangGame.Infrastructure.csproj",              "src/BangGame/BangGame.Infrastructure/"]
COPY ["src/Reminders/Reminders.Domain/Reminders.Domain.csproj",                           "src/Reminders/Reminders.Domain/"]
COPY ["src/Reminders/Reminders.Application/Reminders.Application.csproj",                 "src/Reminders/Reminders.Application/"]
COPY ["src/Reminders/Reminders.Infrastructure/Reminders.Infrastructure.csproj",           "src/Reminders/Reminders.Infrastructure/"]
RUN dotnet restore "src/RecursosUtiles.Api/RecursosUtiles.Api.csproj"

COPY . .
RUN dotnet publish "src/RecursosUtiles.Api/RecursosUtiles.Api.csproj" \
    -c Release -o /app/publish --no-restore

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
USER $APP_UID
COPY --from=build --chown=$APP_UID:$APP_UID /app/publish .
ENTRYPOINT ["dotnet", "RecursosUtiles.Api.dll"]

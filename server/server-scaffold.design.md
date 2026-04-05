# Design: server-scaffold

**Status**: archived  
**Date**: 2026-04-04

## ADR-001: .NET 10 como runtime

**Contexto**: RecursosUtiles necesita un backend para funcionalidades en tiempo real (SignalR) y lógica de dominio. El frontend Angular ya está en producción con varias micro-apps.

**Decisión**: Usar .NET 10 (`net10.0`) como runtime del servidor.

**Alternativas consideradas**:
- **Node.js + Express/Fastify**: Familiar para devs frontend, pero pierde tipado fuerte en dominio, peor rendimiento en CPU-bound, y el ecosistema DDD/Clean Architecture es menos maduro.
- **Java + Spring Boot**: Ecosistema DDD maduro, pero mayor ceremonia, arranque lento, overhead de memoria mayor para un proyecto pequeño.
- **.NET 8/9 LTS**: Estable, pero .NET 10 ofrece mejoras de rendimiento y es el target actual del proyecto.

**Consecuencias**:
- (+) Tipado fuerte con C#, excelente para modelar dominio DDD
- (+) SignalR nativo, sin librerías externas
- (+) Rendimiento alto con Kestrel, minimal overhead
- (+) Tooling maduro (dotnet CLI, testing con xUnit)
- (-) Requiere .NET 10 SDK instalado en desarrollo y CI

---

## ADR-002: Sin ORM — Npgsql + SQL manual

**Contexto**: La capa de persistencia necesita acceder a PostgreSQL. EF Core es el ORM estándar en .NET pero añade abstracción sobre el dominio.

**Decisión**: No usar ORM. Acceso a datos con Npgsql directo y SQL manual en los repositorios de infraestructura.

**Alternativas consideradas**:
- **Entity Framework Core**: Migrations automáticas, LINQ, change tracking. Pero acopla el modelo de dominio a la persistencia (DbContext), genera queries subóptimas en casos complejos, y viola la dependency rule si no se tiene cuidado.
- **Dapper**: Micro-ORM ligero, mapping automático. Buena opción, pero añade dependencia innecesaria cuando Npgsql ya hace mapping con `NpgsqlDataReader`.
- **Npgsql directo**: Control total sobre las queries, sin magia, fuerza a mantener el dominio limpio de concerns de persistencia.

**Consecuencias**:
- (+) Dominio 100% limpio — sin atributos, sin herencia de DbContext
- (+) Control total sobre queries y optimización
- (+) Menos dependencias, menos superficie de bugs
- (-) Migrations manuales (scripts SQL versionados)
- (-) Más código boilerplate en repositorios
- (-) Sin change tracking — el desarrollador gestiona el estado

---

## ADR-003: Proyectos separados por capa (no carpetas)

**Contexto**: La arquitectura hexagonal requiere que las dependencias fluyan hacia dentro (Infrastructure → Application → Domain). Esto se puede enforcar con convenciones de carpetas o con proyectos separados.

**Decisión**: Un proyecto (`.csproj`) por capa por bounded context, más un SharedKernel transversal.

**Alternativas consideradas**:
- **Carpetas dentro de un solo proyecto**: Menos ficheros `.csproj`, pero las dependencias entre capas no se enforcen en compilación — cualquier clase puede referenciar cualquier otra.
- **Proyectos separados con `InternalsVisibleTo`**: Overengineering para este tamaño de proyecto.
- **Proyectos separados simples**: El compilador rechaza referencias circulares. Si Domain referencia Infrastructure, no compila.

**Consecuencias**:
- (+) Dependency rule enforced por el compilador — imposible violar
- (+) Cada capa tiene su propio namespace y responsabilidad clara
- (+) Facilita testing aislado (test projects referencian solo lo necesario)
- (-) Más ficheros de proyecto y más configuración de solución
- (-) Requiere disciplina al añadir nuevos bounded contexts

---

## ADR-004: Result\<T\> pattern en lugar de excepciones

**Contexto**: Los métodos de dominio y aplicación necesitan comunicar errores sin recurrir a excepciones para control de flujo.

**Decisión**: Usar `Result` y `Result<T>` como tipo de retorno para operaciones que pueden fallar. Las excepciones se reservan para errores inesperados (bugs).

**Alternativas consideradas**:
- **Excepciones para todo**: Familiar en .NET, pero rompe el flujo de control, es caro en rendimiento, y el compilador no fuerza su manejo.
- **FluentResults / ErrorOr (librerías)**: Funcionales, pero añaden dependencia externa al SharedKernel y acoplan el dominio a una librería de terceros.
- **Result propio**: Ligero, sin dependencias, adaptado a las necesidades exactas del proyecto.

**Consecuencias**:
- (+) El compilador fuerza a manejar el resultado — no se puede ignorar un error
- (+) Sin dependencias externas en SharedKernel
- (+) Flujo de control explícito y predecible
- (-) Más verboso que lanzar excepciones
- (-) Requiere disciplina para no caer en `result.Value` sin comprobar `IsSuccess`

---

## ADR-005: Health check con AspNetCore.HealthChecks.Npgsql

**Contexto**: El endpoint `/health` necesita verificar que la API puede conectar con PostgreSQL. Esto es crítico para Docker healthchecks, load balancers y monitorización.

**Decisión**: Usar el paquete `AspNetCore.HealthChecks.Npgsql` que extiende el sistema de health checks nativo de ASP.NET Core.

**Alternativas consideradas**:
- **Health check manual con query SQL**: Funciona, pero reimplementa lo que el paquete ya hace (connection check, timeout, degraded state).
- **Solo liveness sin DB check**: Insuficiente — la API puede estar viva pero sin conectividad a la base de datos.
- **AspNetCore.HealthChecks.Npgsql**: Paquete mantenido, integrado con el middleware nativo, soporta tags y timeouts.

**Consecuencias**:
- (+) Integración nativa con `MapHealthChecks`
- (+) Detección automática de PostgreSQL caído
- (+) Compatible con Docker HEALTHCHECK y orquestadores
- (-) Dependencia adicional (aunque ligera y bien mantenida)

---

## SharedKernel — Diseño de clases

### Error

```csharp
namespace RecursosUtiles.SharedKernel;

public sealed record Error(string Code, string Description)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NullValue = new("Error.NullValue", "A null value was provided.");

    public static Error Validation(string code, string description) =>
        new(code, description);

    public static Error NotFound(string code, string description) =>
        new(code, description);

    public static Error Conflict(string code, string description) =>
        new(code, description);
}
```

### Result

```csharp
namespace RecursosUtiles.SharedKernel;

public class Result
{
    protected Result(bool isSuccess, Error error)
    {
        if (isSuccess && error != Error.None)
            throw new InvalidOperationException("Success result cannot have an error.");
        if (!isSuccess && error == Error.None)
            throw new InvalidOperationException("Failure result must have an error.");

        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Error Error { get; }

    public static Result Success() => new(true, Error.None);
    public static Result Failure(Error error) => new(false, error);
    public static Result<T> Success<T>(T value) => new(value, true, Error.None);
    public static Result<T> Failure<T>(Error error) => new(default, false, error);
}
```

### Result\<T\>

```csharp
namespace RecursosUtiles.SharedKernel;

public sealed class Result<T> : Result
{
    private readonly T? _value;

    internal Result(T? value, bool isSuccess, Error error)
        : base(isSuccess, error)
    {
        _value = value;
    }

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access Value on a failure result.");
}
```

### Entity\<TId\>

```csharp
namespace RecursosUtiles.SharedKernel;

public abstract class Entity<TId> : IEquatable<Entity<TId>>
    where TId : notnull
{
    protected Entity(TId id) => Id = id;

    // EF / ORM-free: parameterless constructor not needed
    public TId Id { get; private init; }

    public bool Equals(Entity<TId>? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        return Id.Equals(other.Id);
    }

    public override bool Equals(object? obj) =>
        obj is Entity<TId> entity && Equals(entity);

    public override int GetHashCode() => Id.GetHashCode();

    public static bool operator ==(Entity<TId>? left, Entity<TId>? right) =>
        Equals(left, right);

    public static bool operator !=(Entity<TId>? left, Entity<TId>? right) =>
        !Equals(left, right);
}
```

### ValueObject

```csharp
namespace RecursosUtiles.SharedKernel;

public abstract class ValueObject : IEquatable<ValueObject>
{
    protected abstract IEnumerable<object> GetEqualityComponents();

    public bool Equals(ValueObject? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        return GetEqualityComponents()
            .SequenceEqual(other.GetEqualityComponents());
    }

    public override bool Equals(object? obj) =>
        obj is ValueObject vo && Equals(vo);

    public override int GetHashCode() =>
        GetEqualityComponents()
            .Aggregate(0, (hash, component) =>
                HashCode.Combine(hash, component));

    public static bool operator ==(ValueObject? left, ValueObject? right) =>
        Equals(left, right);

    public static bool operator !=(ValueObject? left, ValueObject? right) =>
        !Equals(left, right);
}
```

---

## Estructura de proyectos

```
RecursosUtiles.sln
│
├── src/
│   ├── RecursosUtiles.Api/                          ← ASP.NET Core WebAPI (host)
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   └── RecursosUtiles.Api.csproj
│   │       → references: Auth.Infrastructure, SharedKernel
│   │
│   ├── RecursosUtiles.SharedKernel/                 ← primitivas transversales
│   │   ├── Error.cs
│   │   ├── Result.cs
│   │   ├── ResultT.cs
│   │   ├── Entity.cs
│   │   └── ValueObject.cs
│   │       → references: (ninguna)
│   │
│   ├── RecursosUtiles.Auth.Domain/                  ← entidades, value objects, ports
│   │   └── RecursosUtiles.Auth.Domain.csproj
│   │       → references: SharedKernel
│   │
│   ├── RecursosUtiles.Auth.Application/             ← use cases, application ports
│   │   └── RecursosUtiles.Auth.Application.csproj
│   │       → references: Auth.Domain, SharedKernel
│   │
│   └── RecursosUtiles.Auth.Infrastructure/          ← adapters, repos, providers
│       └── RecursosUtiles.Auth.Infrastructure.csproj
│           → references: Auth.Application, SharedKernel
│
├── tests/
│   ├── RecursosUtiles.Auth.Domain.Tests/
│   │   └── RecursosUtiles.Auth.Domain.Tests.csproj
│   │       → references: Auth.Domain, SharedKernel
│   │
│   ├── RecursosUtiles.Auth.Application.Tests/
│   │   └── RecursosUtiles.Auth.Application.Tests.csproj
│   │       → references: Auth.Application, Auth.Domain, SharedKernel
│   │
│   └── RecursosUtiles.SharedKernel.Tests/
│       └── RecursosUtiles.SharedKernel.Tests.csproj
│           → references: SharedKernel
│
└── docker-compose.yml
```

### Grafo de dependencias

```
Api ──→ Auth.Infrastructure ──→ Auth.Application ──→ Auth.Domain
 │              │                       │                  │
 └──────────────┴───────────────────────┴──────────────────┴──→ SharedKernel
```

Dirección: siempre hacia dentro. Domain no referencia nada externo (solo SharedKernel). Application no referencia Infrastructure. El compilador lo enforza.

---

## API — Program.cs

Pipeline de middleware y servicios registrados, en orden:

```csharp
var builder = WebApplication.CreateBuilder(args);

// === 1. SERVICIOS ===

// 1a. CORS — orígenes parametrizables desde appsettings
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();  // necesario para SignalR
    });
});

// 1b. Health checks — PostgreSQL
builder.Services
    .AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        tags: ["db", "ready"]);

// 1c. Swagger — solo Development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

// 1d. Auth bounded context DI (cuando haya servicios)
// builder.Services.AddAuthInfrastructure(builder.Configuration);

var app = builder.Build();

// === 2. MIDDLEWARE PIPELINE (orden importa) ===

// 2a. Swagger — solo Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2b. CORS — antes de routing/auth
app.UseCors();

// 2c. Health check endpoint
app.MapHealthChecks("/health");

// 2d. Placeholder root
app.MapGet("/", () => Results.Ok(new { status = "running" }));

app.Run();

// Necesario para WebApplicationFactory en integration tests
public partial class Program;
```

### Configuración — appsettings.Development.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=recursos_utiles;Username=dev;Password=dev"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200"]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### Configuración — appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Cors": {
    "AllowedOrigins": []
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

---

## Docker Compose

```yaml
services:
  postgres:
    image: postgres:17
    container_name: recursos-utiles-db
    environment:
      POSTGRES_DB: recursos_utiles
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev -d recursos_utiles"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s

volumes:
  pgdata:
```

### Uso

```bash
docker compose up -d          # arrancar PostgreSQL
docker compose down            # parar
docker compose down -v         # parar y borrar volumen (reset data)
```

---

## Convenciones de test

### Naming

Patrón: `Método_Escenario_ResultadoEsperado`

```csharp
// Ejemplos:
public void Success_WithValue_ReturnsIsSuccessTrue()
public void Failure_WithError_ReturnsIsFailureTrueAndError()
public void Equals_SameId_ReturnsTrue()
public void Equals_DifferentId_ReturnsFalse()
public void GetHashCode_SameComponents_ReturnsSameHash()
```

### Estructura por proyecto de test

```
tests/
├── RecursosUtiles.SharedKernel.Tests/
│   ├── ResultTests.cs
│   ├── ResultTTests.cs
│   ├── ErrorTests.cs
│   ├── EntityTests.cs         (con stub TestEntity : Entity<Guid>)
│   └── ValueObjectTests.cs    (con stub TestValueObject : ValueObject)
│
├── RecursosUtiles.Auth.Domain.Tests/
│   └── (smoke test placeholder)
│
└── RecursosUtiles.Auth.Application.Tests/
    └── (smoke test placeholder)
```

### Framework y paquetes de test

```xml
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
<PackageReference Include="xunit" Version="2.*" />
<PackageReference Include="xunit.runner.visualstudio" Version="2.*" />
<PackageReference Include="FluentAssertions" Version="8.*" />
```

### Patrón de smoke test placeholder

```csharp
namespace RecursosUtiles.Auth.Domain.Tests;

public class SmokeTests
{
    [Fact]
    public void ProjectReference_IsValid() => Assert.True(true);
}
```

Propósito: verificar que las referencias entre proyectos compilan correctamente y que el test runner detecta el proyecto.

---

## Extensibilidad — Añadir un nuevo bounded context

Para añadir un bounded context nuevo (ej. `Lobby`), seguir estos pasos:

### 1. Crear proyectos

```bash
dotnet new classlib -n RecursosUtiles.Lobby.Domain -o src/RecursosUtiles.Lobby.Domain
dotnet new classlib -n RecursosUtiles.Lobby.Application -o src/RecursosUtiles.Lobby.Application
dotnet new classlib -n RecursosUtiles.Lobby.Infrastructure -o src/RecursosUtiles.Lobby.Infrastructure
dotnet new xunit -n RecursosUtiles.Lobby.Domain.Tests -o tests/RecursosUtiles.Lobby.Domain.Tests
dotnet new xunit -n RecursosUtiles.Lobby.Application.Tests -o tests/RecursosUtiles.Lobby.Application.Tests
```

### 2. Añadir a la solución

```bash
dotnet sln add src/RecursosUtiles.Lobby.Domain
dotnet sln add src/RecursosUtiles.Lobby.Application
dotnet sln add src/RecursosUtiles.Lobby.Infrastructure
dotnet sln add tests/RecursosUtiles.Lobby.Domain.Tests
dotnet sln add tests/RecursosUtiles.Lobby.Application.Tests
```

### 3. Configurar referencias (dependency rule)

```bash
# Domain → SharedKernel (solo)
dotnet add src/RecursosUtiles.Lobby.Domain reference src/RecursosUtiles.SharedKernel

# Application → Domain + SharedKernel
dotnet add src/RecursosUtiles.Lobby.Application reference src/RecursosUtiles.Lobby.Domain
dotnet add src/RecursosUtiles.Lobby.Application reference src/RecursosUtiles.SharedKernel

# Infrastructure → Application + SharedKernel (NO Domain directo)
dotnet add src/RecursosUtiles.Lobby.Infrastructure reference src/RecursosUtiles.Lobby.Application
dotnet add src/RecursosUtiles.Lobby.Infrastructure reference src/RecursosUtiles.SharedKernel

# Api → Infrastructure
dotnet add src/RecursosUtiles.Api reference src/RecursosUtiles.Lobby.Infrastructure
```

### 4. Registrar DI en Program.cs

Crear un método de extensión en Infrastructure:

```csharp
// RecursosUtiles.Lobby.Infrastructure/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddLobbyInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // registrar repos, providers, etc.
        return services;
    }
}
```

Llamar desde Program.cs:

```csharp
builder.Services.AddLobbyInfrastructure(builder.Configuration);
```

### Regla clave

Nunca añadir referencia de Domain hacia Application o Infrastructure. Nunca añadir referencia de Application hacia Infrastructure. El compilador rechazará dependencias circulares, pero las unidireccionales incorrectas (Domain → Infrastructure) hay que evitarlas por disciplina y code review.

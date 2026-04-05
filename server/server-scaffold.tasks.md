# Tasks: server-scaffold

**Status**: archived  
**Date**: 2026-04-04

## Fase 1 — Scaffolding de la solución

- [ ] 1.1 Crear la solución .NET 10 — ejecutar `dotnet new sln -n RecursosUtiles` en `server/`. Genera `server/RecursosUtiles.sln`.
- [ ] 1.2 Crear proyecto `RecursosUtiles.Api` — `dotnet new webapi -n RecursosUtiles.Api -o src/RecursosUtiles.Api --no-openapi`. Fichero: `src/RecursosUtiles.Api/RecursosUtiles.Api.csproj`.
- [ ] 1.3 Crear proyecto `RecursosUtiles.SharedKernel` — `dotnet new classlib -n RecursosUtiles.SharedKernel -o src/RecursosUtiles.SharedKernel`. Fichero: `src/RecursosUtiles.SharedKernel/RecursosUtiles.SharedKernel.csproj`.
- [ ] 1.4 Crear proyecto `RecursosUtiles.Auth.Domain` — `dotnet new classlib -n RecursosUtiles.Auth.Domain -o src/Auth/RecursosUtiles.Auth.Domain`. Fichero: `src/Auth/RecursosUtiles.Auth.Domain/RecursosUtiles.Auth.Domain.csproj`.
- [ ] 1.5 Crear proyecto `RecursosUtiles.Auth.Application` — `dotnet new classlib -n RecursosUtiles.Auth.Application -o src/Auth/RecursosUtiles.Auth.Application`. Fichero: `src/Auth/RecursosUtiles.Auth.Application/RecursosUtiles.Auth.Application.csproj`.
- [ ] 1.6 Crear proyecto `RecursosUtiles.Auth.Infrastructure` — `dotnet new classlib -n RecursosUtiles.Auth.Infrastructure -o src/Auth/RecursosUtiles.Auth.Infrastructure`. Fichero: `src/Auth/RecursosUtiles.Auth.Infrastructure/RecursosUtiles.Auth.Infrastructure.csproj`.
- [ ] 1.7 Crear proyecto de tests `RecursosUtiles.Auth.Domain.Tests` — `dotnet new xunit -n RecursosUtiles.Auth.Domain.Tests -o tests/Auth/RecursosUtiles.Auth.Domain.Tests`. Fichero: `tests/Auth/RecursosUtiles.Auth.Domain.Tests/RecursosUtiles.Auth.Domain.Tests.csproj`.
- [ ] 1.8 Crear proyecto de tests `RecursosUtiles.Auth.Application.Tests` — `dotnet new xunit -n RecursosUtiles.Auth.Application.Tests -o tests/Auth/RecursosUtiles.Auth.Application.Tests`. Fichero: `tests/Auth/RecursosUtiles.Auth.Application.Tests/RecursosUtiles.Auth.Application.Tests.csproj`.
- [ ] 1.9 Crear proyecto de tests `RecursosUtiles.SharedKernel.Tests` — `dotnet new xunit -n RecursosUtiles.SharedKernel.Tests -o tests/RecursosUtiles.SharedKernel.Tests`. Fichero: `tests/RecursosUtiles.SharedKernel.Tests/RecursosUtiles.SharedKernel.Tests.csproj`.
- [ ] 1.10 Agregar todos los proyectos a la solución — `dotnet sln add` para cada `.csproj` (7 proyectos src + 3 tests). Modifica: `RecursosUtiles.sln`.
- [ ] 1.11 Configurar referencias de dependencia: `Auth.Application` → `Auth.Domain`. Modifica: `RecursosUtiles.Auth.Application.csproj`.
- [ ] 1.12 Configurar referencias de dependencia: `Auth.Infrastructure` → `Auth.Application`. Modifica: `RecursosUtiles.Auth.Infrastructure.csproj`.
- [ ] 1.13 Configurar referencias de dependencia: `Api` → `Auth.Infrastructure`. Modifica: `RecursosUtiles.Api.csproj`.
- [ ] 1.14 Agregar referencia `SharedKernel` a todos los proyectos src y tests — 9 proyectos en total. Modifica: cada `.csproj` correspondiente.
- [ ] 1.15 Agregar referencia de cada proyecto de tests al proyecto bajo test — `Auth.Domain.Tests` → `Auth.Domain`, `Auth.Application.Tests` → `Auth.Application`, `SharedKernel.Tests` → `SharedKernel`. Modifica: cada `.csproj` de test.
- [ ] 1.16 Añadir `FluentAssertions` a los tres proyectos de test — `dotnet add package FluentAssertions`. Modifica: los tres `.csproj` de test.
- [ ] 1.17 Verificar que `dotnet build` pasa sin errores desde `server/`.

## Fase 2 — SharedKernel (TDD: RED → GREEN → TRIANGULATE → REFACTOR)

- [ ] 2.1 [RED] Escribir tests para `Error` — casos: `None` tiene Code y Description vacíos, `NullValue` tiene code correcto, `Validation/NotFound/Conflict` crean instancias con los valores dados, dos `Error` con mismos valores son iguales (record). Fichero: `tests/RecursosUtiles.SharedKernel.Tests/ErrorTests.cs`.
- [ ] 2.2 [GREEN] Implementar `Error` — `sealed record Error(string Code, string Description)` con campos estáticos `None`, `NullValue` y factory methods `Validation`, `NotFound`, `Conflict`. Fichero: `src/RecursosUtiles.SharedKernel/Error.cs`.
- [ ] 2.3 [RED] Escribir tests para `Result` y `Result<T>` — casos: `Success()` tiene `IsSuccess=true` y `Error=None`, `Failure(error)` tiene `IsFailure=true` y el error correcto, `Success<T>(value)` expone el valor, `Failure<T>(error)` tiene `IsFailure=true`, conversión implícita `Error → Result` devuelve `Failure`. Fichero: `tests/RecursosUtiles.SharedKernel.Tests/ResultTests.cs`.
- [ ] 2.4 [GREEN] Implementar `Result` y `Result<T>` — clase base `Result` con constructor protegido, propiedades `IsSuccess`/`IsFailure`/`Error`, métodos estáticos `Success()`, `Failure(error)`, `Success<T>(value)`, `Failure<T>(error)`, operador implícito `Error → Result`. Clase derivada `Result<T>` con propiedad `Value`. Fichero: `src/RecursosUtiles.SharedKernel/Result.cs`.
- [ ] 2.5 [RED] Escribir tests para `Entity<TId>` — casos: dos entidades con mismo `Id` son iguales (`Equals` y `==`), dos entidades con distinto `Id` no son iguales, `GetHashCode` es consistente con la igualdad. Fichero: `tests/RecursosUtiles.SharedKernel.Tests/EntityTests.cs`.
- [ ] 2.6 [GREEN] Implementar `Entity<TId>` — clase abstracta que implementa `IEquatable<Entity<TId>>`, igualdad por `Id`, `GetHashCode` basado en `Id`, setter protegido para `Id`. Fichero: `src/RecursosUtiles.SharedKernel/Entity.cs`.
- [ ] 2.7 [RED] Escribir tests para `ValueObject` — casos: dos instancias con mismos componentes son iguales, instancias con distintos componentes no son iguales, `GetHashCode` es consistente, `==` y `!=` funcionan correctamente. Fichero: `tests/RecursosUtiles.SharedKernel.Tests/ValueObjectTests.cs`.
- [ ] 2.8 [GREEN] Implementar `ValueObject` — clase abstracta que implementa `IEquatable<ValueObject>`, igualdad estructural vía `GetEqualityComponents()`, `GetHashCode` basado en los componentes, operadores `==` y `!=`. Fichero: `src/RecursosUtiles.SharedKernel/ValueObject.cs`.
- [ ] 2.9 Ejecutar `dotnet test tests/RecursosUtiles.SharedKernel.Tests` — todos los tests deben estar en GREEN.

## Fase 3 — API base

- [ ] 3.1 Instalar paquetes NuGet en `RecursosUtiles.Api`: `AspNetCore.HealthChecks.Npgsql` y `Swashbuckle.AspNetCore` (si no incluido por defecto). Modifica: `RecursosUtiles.Api.csproj`.
- [ ] 3.2 Escribir `Program.cs` con el orden de middleware correcto: builder → `AddHealthChecks().AddNpgSql(...)` → `AddCors(...)` → `AddControllers()` → `AddEndpointsApiExplorer()` → `AddSwaggerGen()` / app → Swagger solo en `Development` → `UseCors()` → `MapHealthChecks("/health")` → `MapGet("/", ...)` → `MapControllers()`. Fichero: `src/RecursosUtiles.Api/Program.cs`.
- [ ] 3.3 Configurar `appsettings.json` con sección `Cors.AllowedOrigins` vacía y `ConnectionStrings.DefaultConnection` vacía (plantilla sin valores de dev). Fichero: `src/RecursosUtiles.Api/appsettings.json`.
- [ ] 3.4 Configurar `appsettings.Development.json` con `ConnectionStrings.DefaultConnection = "Host=localhost;Port=5432;Database=recursos_utiles;Username=dev;Password=dev"` y `Cors.AllowedOrigins = ["http://localhost:4200"]`. Fichero: `src/RecursosUtiles.Api/appsettings.Development.json`.
- [ ] 3.5 Configurar `launchSettings.json` para exponer el API en el puerto 5000 (HTTP). Fichero: `src/RecursosUtiles.Api/Properties/launchSettings.json`.
- [ ] 3.6 Verificar que `dotnet build src/RecursosUtiles.Api` pasa sin errores.

## Fase 4 — Docker

- [ ] 4.1 Crear `docker/docker-compose.yml` con servicio `postgres` usando imagen `postgres:17`, puerto `5432:5432`, variables de entorno `POSTGRES_DB=recursos_utiles`, `POSTGRES_USER=dev`, `POSTGRES_PASSWORD=dev`, volumen nombrado `pgdata` y healthcheck con `pg_isready`. Fichero: `docker/docker-compose.yml`.
- [ ] 4.2 Verificar sintaxis del fichero con `docker compose config` (si Docker disponible) o revisión manual.

## Fase 5 — Verificación

- [ ] 5.1 Añadir smoke test a `RecursosUtiles.Auth.Domain.Tests` — `[Fact] public void ProjectReference_IsValid() => Assert.True(true);`. Fichero: `tests/Auth/RecursosUtiles.Auth.Domain.Tests/SmokeTests.cs`.
- [ ] 5.2 Añadir smoke test a `RecursosUtiles.Auth.Application.Tests` — ídem. Fichero: `tests/Auth/RecursosUtiles.Auth.Application.Tests/SmokeTests.cs`.
- [ ] 5.3 Ejecutar `dotnet build` desde `server/` — sin errores ni warnings de referencia.
- [ ] 5.4 Ejecutar `dotnet test` desde `server/` — todos los tests en GREEN (SharedKernel.Tests + smoke tests).
- [ ] 5.5 Verificar que `RecursosUtiles.sln` referencia exactamente los proyectos declarados en el spec (7 total): Api, SharedKernel, Auth.Domain, Auth.Application, Auth.Infrastructure, Auth.Domain.Tests, Auth.Application.Tests. Nota: SharedKernel.Tests está en el design pero no en el spec; añadirlo a la solución de todos modos.
- [ ] 5.6 Verificar la cadena de dependencias: Api → Auth.Infrastructure → Auth.Application → Auth.Domain, y todos → SharedKernel. Confirmar que no hay referencias invertidas (capa interna → capa externa).

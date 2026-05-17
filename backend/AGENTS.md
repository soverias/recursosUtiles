# RecursosUtiles — Server

Backend ASP.NET Core 10 para la plataforma RecursosUtiles.

> **Contexto del monorepo**: ver `../project.spec.md` para visión global, principios (importante: **sin backend por defecto** — solo se introduce cuando una feature lo requiere de forma esencial) y estado de los proyectos.
> **Contratos cross-cutting**: los contratos compartidos con el frontend viven en `../specs/<feature>.spec.md`. Hoy: `specs/bang-game.spec.md`.

## Stack

- .NET 10 · ASP.NET Core · SignalR
- PostgreSQL 17 · Npgsql (ADO.NET puro, sin ORM)
- JWT HS256 · Clean Architecture / DDD

## Arrancar

```bash
# Base de datos
cd docker && docker compose up -d

# Servidor (http://localhost:5000)
dotnet run --project src/RecursosUtiles.Api
```

## Tests

```bash
dotnet test
```

---

## Bounded contexts

### server-scaffold
Infraestructura base de la solución: estructura de proyectos, SharedKernel, convenciones.

- [Spec](server-scaffold.spec.md)
- [Design](server-scaffold.design.md)

### auth
Identidad de usuario centralizada. Módulo propietario de `User`, `IUserRepository`, `IJwtService`, `IPasswordHasher`, `RegisterUserUseCase`, `LoginUserUseCase`, `JwtOptions`.

- **Regla de aislamiento**: ningún bounded context (BangGame, Reminders, futuros) puede referenciar `RecursosUtiles.Auth.Domain` ni `RecursosUtiles.Auth.Application`. Los contextos que necesiten identidad la consumen vía el claim `ClaimTypes.NameIdentifier` del JWT. Si necesitan datos del usuario (p.ej. username para mostrar en UI), definen su propio puerto de lectura local — nunca importan `User`.
- `DbConnectionFactory` de Auth es independiente de la de BangGame y Reminders — cada módulo tiene la suya en su propio namespace.
- Spec local: `backend/Auth.spec.md`

### bang-game
Juego de reflejos multijugador en tiempo real. Backend árbitro absoluto via SignalR.

- [Spec](src/BangGame/bang-game.spec.md) — comportamiento esperado por escenario
- [Design](src/BangGame/bang-game.design.md) — arquitectura, contratos SignalR/REST, máquina de estados

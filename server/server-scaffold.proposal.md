# Proposal: server-scaffold

**Change**: `server-scaffold`
**Status**: archived
**Date**: 2026-04-04

---

## 1. Intent

RecursosUtiles necesita un servidor backend que soporte SignalR para comunicacion en tiempo real, autenticacion JWT centralizada y una arquitectura que escale a multiples bounded contexts (uno por herramienta). Actualmente el directorio `server/` esta vacio — no existe ninguna infraestructura backend.

Este change establece el scaffolding base: la solucion .NET 10, la estructura de proyectos siguiendo Hexagonal + DDD + Clean Architecture, las primitivas compartidas en SharedKernel, la configuracion base de la API y el entorno de desarrollo local con PostgreSQL via Docker. Sin este scaffolding, ningun trabajo posterior (Auth, SignalR hubs, herramientas) puede comenzar.

## 2. Scope

### Incluido

- **Solucion .NET 10** (`RecursosUtiles.sln`) con todos los proyectos listados en la estructura acordada
- **SharedKernel** con primitivas base:
  - `Result<T>` / `Result` (patron Result para manejo de errores sin excepciones)
  - `Entity` base class (identidad por Id, igualdad por Id)
  - `ValueObject` base class (igualdad estructural)
  - `Error` record para errores tipados del dominio
- **Proyecto API** (`RecursosUtiles.Api`) con:
  - Configuracion de Swagger/OpenAPI
  - Configuracion de CORS (permisiva para desarrollo, restrictiva para produccion)
  - Health check endpoint (`/health`) incluyendo check de conectividad a PostgreSQL
  - Connection string a PostgreSQL en `appsettings.json` / `appsettings.Development.json`
  - Program.cs con DI basico y pipeline de middleware
- **Bounded context Auth** — solo estructura de carpetas vacias:
  - `RecursosUtiles.Auth.Domain/` (proyecto creado, sin logica de negocio)
  - `RecursosUtiles.Auth.Application/` (proyecto creado, sin logica de negocio)
  - `RecursosUtiles.Auth.Infrastructure/` (proyecto creado, sin logica de negocio)
- **Docker Compose** para desarrollo local:
  - Servicio PostgreSQL con volumen persistente
  - Variables de entorno para credenciales de desarrollo
- **Proyectos de test** con estructura base:
  - `RecursosUtiles.Auth.Domain.Tests/`
  - `RecursosUtiles.Auth.Application.Tests/`
  - Referencia al framework de testing (xUnit) y configuracion basica
  - Sin tests de logica de negocio (no hay logica que testear aun)
- **Reglas de dependencia** enforced via referencias de proyecto:
  - Api depende de Auth.Application y Auth.Infrastructure
  - Auth.Infrastructure depende de Auth.Application
  - Auth.Application depende de Auth.Domain
  - SharedKernel referenciado por todos los proyectos

### Excluido

- Logica de negocio de Auth (entidades, value objects, use cases, repositorios)
- Implementacion de JWT (middleware, token generation, claims)
- SignalR hubs (se implementaran cuando una herramienta lo requiera)
- Migraciones de base de datos o esquema SQL
- CI/CD pipeline
- Configuracion de produccion / despliegue
- Cualquier bounded context de herramientas (store, secret-friend, bang-game)

## 3. Approach

### 3.1 Solucion y proyectos

Crear la solucion con `dotnet new` y anadir los proyectos individuales. Cada proyecto sera una class library excepto `RecursosUtiles.Api` que sera un web API project. Target framework: `net10.0`.

```
server/
  RecursosUtiles.sln
  src/
    RecursosUtiles.Api/                    ← webapi project
    RecursosUtiles.SharedKernel/           ← classlib
    Auth/
      RecursosUtiles.Auth.Domain/          ← classlib
      RecursosUtiles.Auth.Application/     ← classlib
      RecursosUtiles.Auth.Infrastructure/  ← classlib
  tests/
    Auth/
      RecursosUtiles.Auth.Domain.Tests/    ← xunit project
      RecursosUtiles.Auth.Application.Tests/ ← xunit project
  docker/
    docker-compose.yml
```

### 3.2 SharedKernel — primitivas base

**`Result<T>`**: Patron funcional para manejar exitos y errores sin excepciones. Incluye `Result` (sin valor) y `Result<T>` (con valor). Los errores se representan con un record `Error(string Code, string Description)`.

**`Entity`**: Clase base abstracta con `Id` generico (`Entity<TId>`). Igualdad por identidad (Id), no por atributos. Override de `Equals`, `GetHashCode`, `==`, `!=`.

**`ValueObject`**: Clase base abstracta. Igualdad estructural via `GetEqualityComponents()`. Override de `Equals`, `GetHashCode`, `==`, `!=`.

### 3.3 API — configuracion base

- **Program.cs** minimalista: registra servicios, middleware pipeline, health checks
- **Swagger** habilitado solo en Development
- **CORS** configurado con policy nombrada; origins parametrizables via appsettings
- **Health checks**: endpoint `/health` con check de PostgreSQL usando `AspNetCore.HealthChecks.Npgsql`
- **Connection string** en `appsettings.Development.json` apuntando al PostgreSQL de Docker (`Host=localhost;Port=5432;Database=recursos_utiles;Username=dev;Password=dev`)

### 3.4 Docker Compose

Un unico servicio `postgres` con:
- Imagen `postgres:17`
- Puerto 5432 mapeado
- Volumen nombrado para persistencia
- Variables de entorno para usuario/password/database de desarrollo

### 3.5 Proyectos de test

- Framework: **xUnit** con `Microsoft.NET.Test.Sdk`
- Cada proyecto de test referencia su proyecto correspondiente
- Incluir un test placeholder que pase (smoke test) para verificar que la infraestructura de tests funciona
- Preparados para TDD estricto cuando comience la implementacion de Auth

### 3.6 Regla de dependencias (compile-time enforcement)

Las referencias entre proyectos garantizan la regla de dependencias en tiempo de compilacion:

```
Api → Auth.Infrastructure → Auth.Application → Auth.Domain
Api → Auth.Application
Api → SharedKernel
Auth.Domain → SharedKernel
Auth.Application → SharedKernel
Auth.Infrastructure → SharedKernel
```

Domain NUNCA referencia Application ni Infrastructure. Application NUNCA referencia Infrastructure. Esto es enforced por el grafo de project references — si alguien intenta anadir una referencia prohibida, debe hacerlo explicitamente en el .csproj.

## 4. Rollback Plan

Este change es puramente aditivo (crea ficheros nuevos en un directorio vacio). Rollback:

1. `git revert <commit>` deshace todo el scaffolding
2. Alternativa: `rm -rf server/src server/tests server/docker server/RecursosUtiles.sln`
3. El Docker volume de PostgreSQL se elimina con `docker-compose down -v`

Riesgo de rollback: **nulo** — no hay codigo existente que pueda romperse.

## 5. Affected Modules

| Accion | Path |
|--------|------|
| Crear | `server/RecursosUtiles.sln` |
| Crear | `server/src/RecursosUtiles.Api/` |
| Crear | `server/src/RecursosUtiles.SharedKernel/` |
| Crear | `server/src/Auth/RecursosUtiles.Auth.Domain/` |
| Crear | `server/src/Auth/RecursosUtiles.Auth.Application/` |
| Crear | `server/src/Auth/RecursosUtiles.Auth.Infrastructure/` |
| Crear | `server/tests/Auth/RecursosUtiles.Auth.Domain.Tests/` |
| Crear | `server/tests/Auth/RecursosUtiles.Auth.Application.Tests/` |
| Crear | `server/docker/docker-compose.yml` |

## 6. Risks

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| .NET 10 no disponible como SDK estable en la maquina de desarrollo | Media | Alto | Verificar disponibilidad del SDK antes de ejecutar. Si no esta disponible, usar .NET 9 como fallback temporal y actualizar cuando .NET 10 este disponible |
| SharedKernel evoluciona y rompe contratos en bounded contexts dependientes | Baja | Medio | SharedKernel solo contiene primitivas estables y bien testeadas. Cambios breaking requieren actualizacion coordinada |
| PostgreSQL health check falla por timing en Docker startup | Baja | Bajo | Docker compose con `healthcheck` en el servicio postgres; la API reintenta conexion via health check |

## 7. Open Questions

1. **Version exacta del SDK .NET**: Confirmar si .NET 10 LTS esta disponible como SDK en la maquina o si se debe usar .NET 9 temporalmente. (Resolver antes de `apply`.)
2. **Puerto de la API**: Usar el puerto por defecto de Kestrel (5000/5001) o configurar uno especifico para evitar colisiones con el frontend Angular dev server (tipicamente 4200). Propuesta: usar 5050 para HTTP en desarrollo.
3. **Paquete de health check de PostgreSQL**: `AspNetCore.HealthChecks.Npgsql` vs health check custom con `Npgsql` directo. Propuesta: usar el paquete de la comunidad por simplicidad.

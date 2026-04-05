# Spec: server-scaffold

**Change**: server-scaffold  
**Project**: recursosUtiles-server  
**Status**: archived  
**Date**: 2026-04-04

---

## 1. Estructura de la solución

### Scenario: Solución .NET 10 con todos los proyectos declarados
**Given** el repositorio no contiene ningún fichero de solución  
**When** se ejecuta el scaffolding del change  
**Then** MUST existir `RecursosUtiles.slnx` (o `RecursosUtiles.sln`) en la raíz de `server/`  
**And** la solución MUST referenciar exactamente los proyectos: `RecursosUtiles.Api`, `RecursosUtiles.SharedKernel`, `RecursosUtiles.Auth.Domain`, `RecursosUtiles.Auth.Application`, `RecursosUtiles.Auth.Infrastructure`, `RecursosUtiles.Auth.Domain.Tests`, `RecursosUtiles.Auth.Application.Tests`

### Scenario: Target framework net10.0 en todos los proyectos
**Given** cualquier proyecto `.csproj` del change  
**When** se inspecciona su `<TargetFramework>`  
**Then** MUST ser `net10.0`

### Scenario: Proyecto Api es de tipo webapi
**Given** el proyecto `RecursosUtiles.Api`  
**When** se inspecciona su `.csproj`  
**Then** MUST usar el SDK `Microsoft.NET.Sdk.Web`

### Scenario: Proyectos de librería son classlib
**Given** cualquiera de los proyectos `SharedKernel`, `Auth.Domain`, `Auth.Application`, `Auth.Infrastructure`  
**When** se inspecciona su `.csproj`  
**Then** MUST usar el SDK `Microsoft.NET.Sdk`

### Scenario: Proyectos de test son xUnit
**Given** cualquiera de los proyectos `Auth.Domain.Tests`, `Auth.Application.Tests`  
**When** se inspecciona su `.csproj`  
**Then** MUST usar el SDK `Microsoft.NET.Sdk`  
**And** MUST referenciar los paquetes `xunit`, `xunit.runner.visualstudio` y `Microsoft.NET.Test.Sdk`

### Scenario: Cadena de dependencias compile-time correcta
**Given** los proyectos con su grafo de referencias  
**When** se resuelven las referencias de proyecto  
**Then** `RecursosUtiles.Api` MUST referenciar `RecursosUtiles.Auth.Infrastructure`  
**And** `RecursosUtiles.Auth.Infrastructure` MUST referenciar `RecursosUtiles.Auth.Application`  
**And** `RecursosUtiles.Auth.Application` MUST referenciar `RecursosUtiles.Auth.Domain`  
**And** todos los proyectos anteriores MUST referenciar `RecursosUtiles.SharedKernel`  
**And** ningún proyecto de capas internas (Domain, Application, SharedKernel) MUST referenciar capas externas (Infrastructure, Api)

### Scenario: Estructura de directorios respetada
**Given** la raíz `server/`  
**When** se verifica la estructura de ficheros  
**Then** MUST existir los directorios `src/`, `src/Auth/`, `tests/`, `tests/Auth/`, `docker/`  
**And** cada proyecto MUST residir en su ruta definida en la propuesta

---

## 2. SharedKernel — Result\<T\> y Result

### Scenario: Result exitoso wrappea valor
**Given** un valor de tipo `T`  
**When** se crea `Result.Success<T>(value)`  
**Then** `result.IsSuccess` MUST ser `true`  
**And** `result.Value` MUST retornar el valor original  
**And** `result.Error` SHOULD ser `Error.None`

### Scenario: Result fallido contiene error
**Given** un `Error` con código y mensaje  
**When** se crea `Result<T>.Failure(error)`  
**Then** `result.IsSuccess` MUST ser `false`  
**And** `result.Error` MUST retornar el error proporcionado  
**And** acceder a `result.Value` cuando `IsSuccess` es `false` SHOULD lanzar `InvalidOperationException`

### Scenario: Result sin valor exitoso
**Given** una operación que no produce valor  
**When** se crea `Result.Success()`  
**Then** `result.IsSuccess` MUST ser `true`

### Scenario: Result sin valor fallido
**Given** un `Error` con código y mensaje  
**When** se crea `Result.Failure(error)`  
**Then** `result.IsSuccess` MUST ser `false`  
**And** `result.Error` MUST ser el error proporcionado

### Scenario: Error record con código y mensaje
**Given** dos strings: código y descripción  
**When** se instancia `Error(code, description)`  
**Then** `error.Code` MUST retornar el código  
**And** `error.Description` MUST retornar la descripción  
**And** dos `Error` con mismo código y descripción MUST ser iguales por valor (record equality)

### Scenario: Conversión implícita de Error a Result fallido
**Given** un `Error`  
**When** se asigna implícitamente a un `Result` o `Result<T>`  
**Then** SHOULD producir un `Result` fallido con ese error (implicit operator)

---

## 3. SharedKernel — Entity\<TId\>

### Scenario: Entidades con mismo Id son iguales
**Given** dos instancias de una entidad derivada de `Entity<TId>` con el mismo `Id`  
**When** se comparan con `==` o `.Equals()`  
**Then** MUST retornar `true`

### Scenario: Entidades con distinto Id son distintas
**Given** dos instancias de una entidad derivada de `Entity<TId>` con `Id` diferentes  
**When** se comparan con `==` o `.Equals()`  
**Then** MUST retornar `false`

### Scenario: Entity<TId> expone Id protegido
**Given** la clase base `Entity<TId>`  
**When** se inspecciona su contrato público  
**Then** MUST exponer una propiedad `Id` de tipo `TId`  
**And** el setter de `Id` SHOULD ser `protected` o `private`

### Scenario: GetHashCode consistente con igualdad
**Given** dos entidades con el mismo `Id`  
**When** se llama a `GetHashCode()` en ambas  
**Then** MUST retornar el mismo hash

---

## 4. SharedKernel — ValueObject

### Scenario: ValueObjects con mismos componentes son iguales
**Given** dos instancias de un ValueObject con los mismos valores atómicos  
**When** se comparan con `==` o `.Equals()`  
**Then** MUST retornar `true`

### Scenario: ValueObjects con distintos componentes son distintos
**Given** dos instancias de un ValueObject con al menos un valor distinto  
**When** se comparan con `==` o `.Equals()`  
**Then** MUST retornar `false`

### Scenario: GetHashCode derivado de los componentes
**Given** un ValueObject con componentes conocidos  
**When** se llama a `GetHashCode()`  
**Then** MUST derivarse de los mismos componentes que participan en la igualdad  
**And** dos instancias iguales MUST tener el mismo hash

### Scenario: ValueObject expone componentes de igualdad
**Given** la clase base `ValueObject`  
**When** se implementa una subclase  
**Then** MUST sobreescribir un método `GetEqualityComponents()` que retorne `IEnumerable<object?>`

---

## 5. API — Configuración base

### Scenario: Swagger disponible solo en Development
**Given** la API arrancada con `ASPNETCORE_ENVIRONMENT=Development`  
**When** se accede a `/swagger`  
**Then** MUST retornar HTTP 200

**Given** la API arrancada con `ASPNETCORE_ENVIRONMENT=Production`  
**When** se accede a `/swagger`  
**Then** MUST retornar HTTP 404 o redirigir a una ruta no existente

### Scenario: CORS parametrizable por appsettings
**Given** un `appsettings.json` con una sección `Cors` que define orígenes permitidos  
**When** se resuelve la política CORS en el pipeline  
**Then** MUST leer los orígenes desde `appsettings.json`  
**And** en Development SHOULD permitir cualquier origen si la lista está vacía o contiene `*`

### Scenario: API escucha en puerto 5000 en desarrollo
**Given** `launchSettings.json` o `appsettings.Development.json`  
**When** se arrancan los perfiles de desarrollo  
**Then** el perfil HTTP MUST apuntar a `http://localhost:5000`

### Scenario: appsettings contiene connection string de desarrollo
**Given** `appsettings.Development.json`  
**When** se lee la clave `ConnectionStrings:Default`  
**Then** MUST ser `Host=localhost;Port=5432;Database=recursos_utiles;Username=dev;Password=dev`

### Scenario: Pipeline de middleware en orden correcto
**Given** el programa `Program.cs` de la Api  
**When** se analiza el orden de `app.Use*`  
**Then** MUST registrar en este orden: `UseSwagger` / `UseSwaggerUI` (solo Development), `UseHttpsRedirection` (MAY omitirse en Development), `UseCors`, `UseAuthorization`, `MapHealthChecks`, `MapControllers`

---

## 6. API — Health Check

### Scenario: Endpoint /health responde 200 cuando DB está disponible
**Given** la API arrancada con PostgreSQL accesible  
**When** se realiza `GET /health`  
**Then** MUST retornar HTTP 200  
**And** el body SHOULD contener el estado `Healthy`

### Scenario: Endpoint /health responde degradado o unhealthy cuando DB no está disponible
**Given** la API arrancada con PostgreSQL inaccesible  
**When** se realiza `GET /health`  
**Then** MUST retornar HTTP 503 o HTTP 200 con estado `Unhealthy` / `Degraded`  
**And** el body MUST mencionar el check de PostgreSQL

### Scenario: Health check PostgreSQL registrado con librería Npgsql
**Given** el `Program.cs`  
**When** se analiza el registro de health checks  
**Then** MUST llamar a `AddNpgsql(connectionString)` usando la librería `AspNetCore.HealthChecks.Npgsql`  
**And** el nombre del check SHOULD ser `"postgres"` o `"database"`

### Scenario: Endpoint /health no requiere autenticación
**Given** la API arrancada con middleware de autorización activo  
**When** se realiza `GET /health` sin cabecera `Authorization`  
**Then** MUST retornar HTTP 200 o HTTP 503 (nunca 401 ni 403)

---

## 7. Docker Compose

### Scenario: Servicio postgres disponible en puerto 5432
**Given** el fichero `docker/docker-compose.yml`  
**When** se ejecuta `docker compose up -d`  
**Then** MUST levantar un contenedor con imagen `postgres:17`  
**And** MUST mapear el puerto interno `5432` al host `5432`

### Scenario: Credenciales de desarrollo configuradas
**Given** el servicio `postgres` en `docker-compose.yml`  
**When** se inspeccionan las variables de entorno  
**Then** MUST definir `POSTGRES_DB=recursos_utiles`, `POSTGRES_USER=dev`, `POSTGRES_PASSWORD=dev`

### Scenario: Volumen persistente declarado
**Given** el `docker-compose.yml`  
**When** se inspeccionan los volúmenes del servicio postgres  
**Then** MUST montar un volumen nombrado (o bind mount) en `/var/lib/postgresql/data`  
**And** el volumen nombrado MUST estar declarado en la sección `volumes` de nivel raíz

### Scenario: Compose válido sintácticamente
**Given** el fichero `docker/docker-compose.yml`  
**When** se ejecuta `docker compose config`  
**Then** MUST retornar exit code 0 sin errores de sintaxis

---

## 8. Proyectos de test — xUnit operativo

### Scenario: Smoke test placeholder pasa sin errores
**Given** cualquiera de los proyectos de test `Auth.Domain.Tests` o `Auth.Application.Tests`  
**When** se ejecuta `dotnet test`  
**Then** MUST retornar exit code 0  
**And** MUST ejecutar al menos 1 test  
**And** ningún test MUST estar en estado `Failed`

### Scenario: Estructura de ficheros de test presente
**Given** cada proyecto de test  
**When** se verifica su contenido  
**Then** MUST contener al menos un fichero `*Tests.cs` con al menos un método `[Fact]`

### Scenario: Proyectos de test referencian el proyecto bajo test
**Given** `RecursosUtiles.Auth.Domain.Tests`  
**When** se inspecciona su `.csproj`  
**Then** MUST referenciar `RecursosUtiles.Auth.Domain`

**Given** `RecursosUtiles.Auth.Application.Tests`  
**When** se inspecciona su `.csproj`  
**Then** MUST referenciar `RecursosUtiles.Auth.Application`

### Scenario: Solución compila sin errores ni warnings de error
**Given** la solución completa `RecursosUtiles.sln`  
**When** se ejecuta `dotnet build`  
**Then** MUST retornar exit code 0  
**And** SHOULD no producir warnings tratados como errores (`TreatWarningsAsErrors`)

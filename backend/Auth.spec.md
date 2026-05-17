---
status: implemented
last_change: unified-auth
last_verified: 2026-05-17
---

# Auth — Spec local (backend)

Comportamiento observable del bounded context `Auth`. Describe las responsabilidades del módulo Auth una vez extraído de BangGame: entidades, puertos, casos de uso e infraestructura. El contrato HTTP observable (endpoints, status codes, payloads) vive en `specs/unified-auth.spec.md`.

---

## 1. Dominio

### Requirement: Aggregate root User

El módulo Auth MUST mantener un aggregate root `User` con `Id (Guid)`, `Username (string)`, `PasswordHash (string)`. Ningún otro bounded context MUST referenciar este aggregate directamente.

#### Scenario: Crear usuario

- GIVEN un `username` único y un `password` en texto plano
- WHEN se invoca `RegisterUserUseCase`
- THEN se crea un `User` con `PasswordHash` generado por `IPasswordHasher`
- AND se persiste vía `IUserRepository`

---

## 2. Casos de uso

### Requirement: RegisterUserUseCase

MUST verificar unicidad de `username`. MUST delegar el hash a `IPasswordHasher`. MUST persistir el usuario y devolver un JWT.

#### Scenario: Username ya existente

- GIVEN un `username` que ya existe en `IUserRepository`
- WHEN se invoca `RegisterUserUseCase`
- THEN lanza excepción de dominio `UsernameAlreadyTakenException`

### Requirement: LoginUserUseCase

MUST buscar al usuario por `username`. MUST verificar el password con `IPasswordHasher.Verify`. MUST emitir un JWT vía `IJwtService` si la verificación es correcta.

#### Scenario: Verificación fallida

- GIVEN un `username` existente y un `password` incorrecto
- WHEN se invoca `LoginUserUseCase`
- THEN lanza `InvalidCredentialsException`

---

## 3. Puertos (Application)

| Puerto | Responsabilidad |
|--------|----------------|
| `IUserRepository` | Persistir y recuperar `User` por `Id` o `Username` |
| `IJwtService` | Emitir JWT con `userId` en `ClaimTypes.NameIdentifier` |
| `IPasswordHasher` | Hash y verificación PBKDF2-SHA256 |

### Requirement: IJwtService — parámetros JWT invariantes

`IJwtService` MUST usar el mismo `secret`, `issuer` y `audience` que estaban configurados en BangGame antes de la migración. El cambio de namespace MUST NOT alterar ningún parámetro de firma.

#### Scenario: Token emitido por Auth es verificable con la clave pre-migración

- GIVEN la clave JWT configurada en `JwtOptions` (sin modificar)
- WHEN `IJwtService.IssueToken(userId, username)` emite un token
- THEN el token es verificable con la misma clave usada antes de la migración

---

## 4. Registro DI

### Requirement: AddAuth() extension method

`RecursosUtiles.Auth.Infrastructure` MUST exponer `AddAuth(IServiceCollection, IConfiguration)` que registre `IUserRepository`, `IJwtService`, `IPasswordHasher` y la configuración `JwtOptions`. `AddBangGame()` MUST NOT registrar ninguno de esos servicios tras la migración.

#### Scenario: Sin doble registro

- GIVEN `Program.cs` llama `AddAuth()` antes de `AddBangGame()`
- WHEN el contenedor DI se construye
- THEN `IJwtService` está registrado exactamente una vez

---

## §drift

_Pendiente tras la migración: verificar que ningún archivo bajo `BangGame.*` importa `User`, `IUserRepository`, `JwtService` o `PasswordHasher` del espacio de nombres Auth. Condición de éxito: `grep -r "JwtService\|PasswordHasher\|IUserRepository" backend/src/BangGame/` retorna cero hits._

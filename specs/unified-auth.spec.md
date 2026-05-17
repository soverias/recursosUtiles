---
status: implemented
coverage:
  backend: implemented
  frontend: not_applicable
last_change: unified-auth
last_verified: 2026-05-17
---

# Autenticación Unificada — Spec cross-cutting

Contrato observable compartido por todos los bounded contexts que emiten o consumen identidad de usuario. La fuente de verdad del HTTP contract y las invariantes que DEBEN cumplirse antes y después de la migración.

---

## 1. HTTP Contract — Autenticación

### Requirement: Registro de usuario

El sistema MUST crear una cuenta a partir de `username` + `password`. MUST rechazar usernames duplicados con 409. MUST responder con un JWT válido e inmediatamente usable.

| Campo | Tipo | Notas |
|-------|------|-------|
| `username` | string | Único en la plataforma |
| `password` | string | Almacenado hasheado (PBKDF2-SHA256), nunca en claro |

| Endpoint | Método | Auth | Request | Respuesta éxito | Respuesta error |
|----------|--------|------|---------|-----------------|-----------------|
| `/auth/register` | POST | No | `{ username, password }` | `201 { token, username }` | `409 { error: "Username no disponible" }` |
| `/auth/login` | POST | No | `{ username, password }` | `200 { token, username }` | `401 { error: "Credenciales inválidas" }` |

#### Scenario: Registro exitoso

- GIVEN un `username` no existente y un `password` válido
- WHEN `POST /auth/register { username, password }`
- THEN responde `201 { token: string, username: string }`
- AND el token es un JWT HS256 verificable con la clave del servidor

#### Scenario: Username duplicado

- GIVEN un `username` ya registrado en la base de datos
- WHEN `POST /auth/register { username, password }`
- THEN responde `409 { error: "Username no disponible" }`

#### Scenario: Login exitoso

- GIVEN un usuario registrado con credenciales correctas
- WHEN `POST /auth/login { username, password }`
- THEN responde `200 { token: string, username: string }`

#### Scenario: Credenciales inválidas

- GIVEN un username inexistente o password incorrecto
- WHEN `POST /auth/login { username, password }`
- THEN responde `401 { error: "Credenciales inválidas" }`

---

## 2. Invariantes de la plataforma

### Requirement: Una sola fuente de verdad de identidad

El sistema MUST mantener UNA ÚNICA tabla `users`, UN ÚNICO emisor/audiencia/secreto JWT y UN ÚNICO esquema de hash de contraseñas para todos los bounded contexts de la plataforma.

- El JWT MUST usar HS256 con `ClaimTypes.NameIdentifier` para el `userId` (`Guid`).
- El secreto, issuer y audience JWT MUST ser idénticos antes y después de la migración.
- Las contraseñas MUST almacenarse con PBKDF2-SHA256. Sin excepciones por contexto.

#### Scenario: Token cross-app — mismo JWT en BangGame y Reminders

- GIVEN un usuario registrado vía `POST /auth/register`
- WHEN usa el JWT recibido en `POST /reminders` y al conectar al hub SignalR de BangGame
- THEN ambos endpoints aceptan el token sin reemisión ni renovación

#### Scenario: Compatibilidad de tokens pre-migración

- GIVEN un JWT emitido por el módulo de BangGame (antes de la migración)
- WHEN el mismo token se usa contra la API después de desplegar la migración
- THEN el token es aceptado sin forzar re-login al usuario

---

## 3. Consumo de identidad por bounded context

### Requirement: Claim estándar para userId

Todo bounded context que requiera la identidad del usuario autenticado MUST leer únicamente `ClaimTypes.NameIdentifier` del JWT. MUST NOT asumir claims propietarios ni estructuras extendidas.

- **Reminders**: extrae `userId` de `ClaimTypes.NameIdentifier` para asociar recordatorios al usuario.
- **BangGame**: extrae `userId` del mismo claim para distinguir jugadores registrados de invitados (invitados tienen `userId = null`).

#### Scenario: Reminders identifica al usuario

- GIVEN un JWT válido con `ClaimTypes.NameIdentifier = <userId>`
- WHEN el cliente llama `POST /reminders` con ese JWT en el header `Authorization: Bearer`
- THEN el servidor asocia el recordatorio al `userId` extraído del claim

#### Scenario: BangGame distingue registrado de invitado

- GIVEN una conexión SignalR con JWT válido
- WHEN el servidor extrae `ClaimTypes.NameIdentifier`
- THEN el jugador tiene `UserId` no nulo y puede aparecer en el ranking y en `game_results`

---

## 4. Ranking — integridad de username tras la migración

### Requirement: BangGame accede a username vía puerto de lectura

BangGame MUST NOT referenciar `Auth.Domain` directamente. MUST definir su propio puerto `IBangGamePlayerReader` para obtener el `username` asociado a un `userId`. El endpoint de ranking MUST seguir devolviendo usernames correctamente tras la migración.

#### Scenario: Ranking retorna usernames después de la migración

- GIVEN partidas registradas en `game_results` con `winner_id` y `loser_id` de tipo `Guid`
- WHEN se llama `GET /ranking` después de desplegar la migración
- THEN responde `200` con array `[{ username, wins, avgReactionMs, winRatio }]` con usernames correctos
- AND ningún username es `null` o vacío

---

## Referencias

- Spec local backend Auth: `backend/Auth.spec.md`
- Spec local backend BangGame: `backend/src/BangGame/bang-game.spec.md`
- Spec cross-cutting BangGame: `specs/bang-game.spec.md`
- Spec cross-cutting Reminders: `specs/reminders-system.spec.md`

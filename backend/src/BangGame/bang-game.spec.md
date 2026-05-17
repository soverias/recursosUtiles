---
status: partial
last_change: unified-auth
last_verified: 2026-05-17
pending: |
  - Migrar auth-api fuera de BangGame al módulo Auth (change: unified-auth)
  - Añadir IBangGamePlayerReader para ranking una vez el User aggregate deje de vivir aquí
---

# Specification: bang-game (server, local)

Comportamiento observable del servidor. Cada escenario describe qué hace el servidor
ante una entrada dada — no cómo lo implementa.

> **Contrato cross-cutting**: el contrato compartido con el frontend (forma de los payloads, nombres de eventos, máquina de estados, reglas de arbitraje y temporización) vive en `specs/bang-game.spec.md` en la raíz del monorepo. Este spec añade los escenarios BDD de cada caso del servidor; el contrato es la fuente de verdad si hay divergencia.

---

## §drift — unified-auth

El bounded context BangGame actualmente **posee** el código de autenticación (`User`, `IUserRepository`, `JwtService`, `PasswordHasher`, `RegisterUserUseCase`, `LoginUserUseCase`, `AuthController`). Esto es drift arquitectónico: auth es una responsabilidad cross-cutting que no pertenece a BangGame.

**Cambio en curso** (`unified-auth`):
- `auth-api` se mueve al módulo `Auth` — los escenarios de registro/login descritos en `## auth-api` serán satisfechos por `Auth.Application` + `Auth.Infrastructure`, no por BangGame.
- BangGame define su propio puerto `IBangGamePlayerReader { Task<string?> GetUsernameAsync(Guid id, CancellationToken ct) }` para que `GetRankingUseCase` pueda seguir devolviendo `username` sin referenciar `Auth.Domain`.
- `## auth-api` permanece en este spec como referencia histórica hasta que `sdd-archive` lo elimine al cerrar el cambio.

---

## auth-api

### Requirement: Registro con username único

El servidor MUST crear cuenta con username + password. El servidor MUST rechazar
usernames ya existentes con 409. Las contraseñas MUST almacenarse hasheadas (PBKDF2-SHA256).
El servidor MUST devolver un JWT válido al registrar o loguear.

#### Scenario: Registro exitoso

- GIVEN un username no existente y un password válido
- WHEN `POST /auth/register { username, password }`
- THEN responde 201 con `{ token: string, username: string }`
- AND el token es un JWT HS256 verificable con la clave del servidor

#### Scenario: Username ya en uso

- GIVEN un username ya registrado en la base de datos
- WHEN `POST /auth/register { username, password }`
- THEN responde 409 con `{ error: "Username no disponible" }`

#### Scenario: Login exitoso

- GIVEN un usuario registrado con username + password correctos
- WHEN `POST /auth/login { username, password }`
- THEN responde 200 con `{ token: string, username: string }`

#### Scenario: Credenciales inválidas

- GIVEN un username inexistente o un password incorrecto
- WHEN `POST /auth/login { username, password }`
- THEN responde 401 con `{ error: "Credenciales inválidas" }`

---

## ranking-api

### Requirement: Ranking de jugadores registrados

El servidor MUST devolver todos los usuarios registrados (no invitados) con sus estadísticas
agregadas. El servidor MUST excluir jugadores invitados. El orden por defecto MUST ser
victorias descendente.

#### Scenario: Ranking con resultados

- GIVEN partidas registradas en la base de datos
- WHEN `GET /ranking`
- THEN responde 200 con array `[{ username, wins, avgReactionMs, winRatio }]`
- AND ordenado por `wins` descendente
- AND `avgReactionMs` es la media de `winner_reaction_ms` de victorias legítimas (no false start)
- AND `winRatio` es `wins / total_partidas_jugadas`

#### Scenario: Invitados excluidos

- GIVEN partidas donde uno o ambos jugadores son invitados
- WHEN `GET /ranking`
- THEN los jugadores invitados MUST NOT aparecer en el resultado

#### Scenario: Sin partidas

- GIVEN usuarios registrados sin partidas jugadas
- WHEN `GET /ranking`
- THEN aparecen en el ranking con `wins: 0, avgReactionMs: 0, winRatio: 0`

---

## matchmaking

### Requirement: Cola de matchmaking aleatoria

El servidor MUST mantener una cola in-memory. Al llegar el segundo jugador MUST emparejarlos
inmediatamente en una sala nueva y emitir `OpponentJoined` a ambos.

#### Scenario: Segundo jugador completa el emparejamiento

- GIVEN un jugador A en cola (llamó `JoinRandom`)
- WHEN el jugador B llama `JoinRandom`
- THEN el servidor crea una sala, añade a ambos al grupo SignalR de la sala
- AND emite `OpponentJoined({ roomId, opponentUsername })` al jugador A
- AND emite `OpponentJoined({ roomId, opponentUsername })` al jugador B

#### Scenario: Un solo jugador en cola espera

- GIVEN ningún jugador en cola
- WHEN el jugador A llama `JoinRandom`
- THEN el servidor encola a A y no emite ningún evento (espera)

#### Scenario: Desconexión mientras espera en cola

- GIVEN un jugador en cola de matchmaking
- WHEN se desconecta del hub
- THEN el servidor lo elimina de la cola sin emitir eventos

---

## room-management

### Requirement: Salas privadas con código

El servidor MUST generar un código alfanumérico único de 6 caracteres al crear sala privada.
El servidor MUST permitir a otro jugador unirse por ese código.

#### Scenario: Crear sala privada

- GIVEN un jugador sin sala activa
- WHEN llama `CreatePrivateRoom()`
- THEN el servidor crea una sala privada, añade al jugador al grupo SignalR
- AND emite `RoomCreated({ roomId, code })` solo al creador

#### Scenario: Segundo jugador se une por código

- GIVEN una sala privada con un jugador esperando
- WHEN otro jugador llama `JoinPrivateRoom(code)` con el código correcto
- THEN el servidor añade al jugador a la sala y al grupo SignalR
- AND emite `OpponentJoined({ roomId, opponentUsername })` al creador
- AND emite `OpponentJoined({ roomId, opponentUsername })` al jugador que se unió

#### Scenario: Código inválido o sala llena

- GIVEN un código inexistente o una sala ya con 2 jugadores
- WHEN un jugador llama `JoinPrivateRoom(code)`
- THEN el servidor emite `Error("Sala no encontrada")` solo al invocador

#### Scenario: Jugador abandona la sala

- GIVEN dos jugadores en sala
- WHEN uno llama `LeaveRoom()` o se desconecta
- THEN el servidor emite `OpponentLeft` al jugador restante
- AND cancela cualquier loop de partida en curso

---

## game-arbitration

### Requirement: Árbitro de partida

El servidor es árbitro absoluto. La fase de la sala en el momento en que llega el tap
determina si es false start o victoria. El primer tap resuelve la ronda inmediatamente.

#### Scenario: Ambos listos inician el loop de partida

- GIVEN dos jugadores en sala
- WHEN ambos llaman `SendReady()`
- THEN el servidor emite `BothReady` a ambos
- AND tras 3000ms emite `CountdownStart` a ambos  
  *(nota: en la implementación actual `CountdownStart` se emite primero; el retardo de 3s ocurre después — ver design)*
- AND tras retardo aleatorio 100–2000ms emite `Bang` a ambos
- AND registra el `bangTimestamp`

#### Scenario: Tap legítimo — primer tap en fase bang-active gana

- GIVEN fase `bang-active` (Bang ya emitido)
- WHEN el jugador A envía `SendTap()`
- THEN el servidor resuelve la ronda inmediatamente
- AND emite `RoundResult({ winnerId: A.username, loserId: B.username, winnerReactionMs, loserReactionMs: 0, isFalseStart: false })` a ambos

#### Scenario: False start — tap en fase countdown o waiting-bang

- GIVEN fase `countdown` o `waiting-bang` (Bang aún no emitido)
- WHEN el jugador A envía `SendTap()`
- THEN el servidor resuelve la ronda con false start
- AND el loop de partida en curso es cancelado
- AND emite `RoundResult({ winnerId: B.username, loserId: A.username, winnerReactionMs: 0, loserReactionMs: 0, isFalseStart: true })` a ambos

#### Scenario: Segundo tap ignorado

- GIVEN la ronda ya resuelta (fase `result`)
- WHEN cualquier jugador envía `SendTap()`
- THEN el servidor ignora el tap y no emite ningún evento

#### Scenario: Repetir partida

- GIVEN pantalla de resultado
- WHEN ambos jugadores llaman `Repeat()`
- THEN el servidor resetea la sala a fase `waiting-ready`
- AND emite `BothReady` a ambos e inicia un nuevo loop de partida

---

## persistence

### Requirement: Guardar resultados solo para registrados

El servidor MUST persistir el resultado en `game_results` únicamente si ambos jugadores
tienen cuenta registrada (no invitados). Los resultados de partidas con invitados MUST NOT
almacenarse.

#### Scenario: Ambos registrados — resultado guardado

- GIVEN una ronda resuelta donde ambos jugadores tienen `UserId`
- WHEN se emite `RoundResult`
- THEN el servidor inserta una fila en `game_results` con winner_id, loser_id, reaction_ms e is_false_start

#### Scenario: Al menos un invitado — resultado no guardado

- GIVEN una ronda resuelta donde uno o ambos jugadores son invitados
- WHEN se emite `RoundResult`
- THEN el servidor NO inserta ninguna fila en `game_results`

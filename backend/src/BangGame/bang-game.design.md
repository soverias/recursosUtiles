# Design: bang-game (server)

## Technical Approach

ASP.NET Core 10, Clean Architecture / DDD estricto. Tres capas por bounded context
(Domain → Application → Infrastructure), con el API como punto de entrada que orquesta
todo. El estado de partida vive en memoria con `ConcurrentDictionary`; la lógica de
arbitraje es pura (sin I/O) dentro del agregado `Room`.

## Architecture Decisions

| Decisión | Elección | Alternativa descartada | Razón |
|----------|----------|------------------------|-------|
| Estado de sala | In-memory (`ConcurrentDictionary`) | PostgreSQL | Las salas no necesitan persistir entre reinicios; latencia cero |
| Lock de sala | `lock` interno en `Room` | `SemaphoreSlim` async | Las operaciones de tap son sub-microsegundo; lock síncrono es suficiente y más simple |
| Loop de partida | `Task.Run` + `CancellationTokenSource` por sala | `BackgroundService` global | Aislamiento por sala; cancelación granular en `LeaveRoom` o false start |
| Emisión desde loop | `IHubContext<GameHub>` | `Clients` directo del Hub | El Hub es transitorio (una instancia por invocación); `IHubContext` es singleton |
| Acceso a datos | Npgsql ADO.NET manual | EF Core / Dapper | Sin acoplamiento ORM en el dominio; control total sobre SQL |
| Hashing | PBKDF2-SHA256 nativo (.NET) | BCrypt.Net | Sin dependencias externas; disponible en `System.Security.Cryptography` |
| JWT | HS256, `System.IdentityModel.Tokens.Jwt` | RS256 | Suficiente para un único servidor; clave configurable en appsettings |
| Binding de opciones | `Options.Create()` manual | `services.Configure<T>(section)` | Evita conflicto de versiones con `Microsoft.Extensions.Options.ConfigurationExtensions` |
| Identificador en RoundResult | `username` | `connectionId` | El frontend compara contra su propio username; el connectionId cambia en reconexión |

## Estructura de proyectos

```
src/BangGame/
  BangGame.Domain/
    Entities/        Room (aggregate), Player, User, GameResult, TapResult
    ValueObjects/    RoomCode, GamePhase (enum)
    Ports/           IUserRepository, IGameResultRepository
    Services/        GameArbitratorService (utilidad pura estática)
  BangGame.Application/
    UseCases/        RegisterUser, LoginUser, GetRanking, RecordGameResult
    DTOs/            AuthDtos, RankingItemDto
    Ports/           IJwtService, IPasswordHasher
  BangGame.Infrastructure/
    Auth/            JwtService, PasswordHasher
    Matchmaking/     MatchmakingService (Queue<T> + lock)
    Options/         JwtOptions
    Persistence/     DbConnectionFactory, UserRepository, GameResultRepository
    RoomManager/     RoomService (ConcurrentDictionary + CTS por sala)
    Extensions/      ServiceCollectionExtensions

src/RecursosUtiles.Api/
  Controllers/BangGame/   AuthController, RankingController
  Hubs/                   GameHub
```

## Flujo de datos — partida completa

```
Cliente A                  GameHub                    Room (Domain)
   │                          │                           │
   ├─ SendReady() ───────────►│── room.MarkReady(A) ─────►│
   │                          │                           │
Cliente B                     │                           │
   ├─ SendReady() ───────────►│── room.MarkReady(B) ─────►│─── both ready = true
   │                          │                           │
   │         BothReady ◄──────│                           │
   │                          │── StartGameLoop ──────────┐
   │                          │   (Task.Run)              │
   │                          │                    room.TransitionTo(Countdown)
   │   CountdownStart ◄───────┤◄── IHubContext            │
   │                          │    (3000ms delay)         │
   │                          │                    room.TransitionTo(WaitingBang)
   │                          │    (random 100-1000ms)    │
   │                          │                    room.SetBangActive(bangTimestamp)
   │         Bang ◄───────────┤◄── IHubContext            │
   │                          │                           │
   ├─ SendTap() ─────────────►│── room.ProcessTap(A) ─────►│─── TapResult
   │                          │                           │
   │     RoundResult ◄────────│── Clients.Group           │
   │     RoundResult ◄────────┘                           │
```

## Máquina de estados de Room

```
WaitingOpponent ──(2º jugador se une)──► WaitingReady
WaitingReady    ──(ambos SendReady)────► Countdown      [vía TransitionTo]
Countdown       ──(3000ms)─────────────► WaitingBang    [vía TransitionTo]
WaitingBang     ──(retardo aleatorio)──► BangActive     [vía SetBangActive]
Countdown       ──(tap recibido)───────► Result         [false start — ProcessTap]
WaitingBang     ──(tap recibido)───────► Result         [false start — ProcessTap]
BangActive      ──(tap recibido)───────► Result         [victoria — ProcessTap]
Result          ──(ambos Repeat)───────► WaitingReady   [vía ResetForNextRound]
```

## Contrato SignalR (hub `/hubs/game`)

### Métodos que invoca el cliente

| Método | Descripción |
|--------|-------------|
| `JoinRandom()` | Encola al jugador; empareja si hay otro esperando |
| `CreatePrivateRoom()` | Crea sala privada; emite `RoomCreated` al creador |
| `JoinPrivateRoom(code)` | Se une a sala por código; emite `OpponentJoined` a ambos |
| `SendReady()` | Marca listo; cuando ambos → inicia loop de partida |
| `SendTap()` | Tap del jugador; el servidor arbitra y emite `RoundResult` |
| `Repeat()` | Solicita revancha; cuando ambos → nueva partida |
| `LeaveRoom()` | Sale de sala; emite `OpponentLeft` al otro jugador |

### Eventos que emite el servidor

| Evento | Destinatario | Payload |
|--------|-------------|---------|
| `RoomCreated` | Solo creador | `{ roomId, code }` |
| `OpponentJoined` | Ambos jugadores | `{ roomId, opponentUsername }` |
| `BothReady` | Ambos | — |
| `CountdownStart` | Ambos | — |
| `Bang` | Ambos | — |
| `RoundResult` | Ambos | `{ winnerId, loserId, winnerReactionMs, loserReactionMs, isFalseStart }` |
| `OpponentLeft` | Jugador restante | — |
| `Error` | Solo invocador | `message: string` |

> `winnerId` y `loserId` contienen el **username** del jugador, no el connectionId.

## REST API

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Registra usuario; devuelve JWT |
| `/auth/login` | POST | No | Autentica; devuelve JWT |
| `/ranking` | GET | No | Lista jugadores registrados con stats |

## Schema de base de datos

```sql
users (id UUID PK, username TEXT UNIQUE, password_hash TEXT, is_guest BOOLEAN)
game_results (id UUID PK, winner_id UUID FK, loser_id UUID FK,
              winner_reaction_ms INT, loser_reaction_ms INT,
              is_false_start BOOLEAN, played_at TIMESTAMPTZ)
```

## Autenticación de invitados

Los invitados conectan al hub sin JWT. El hub extrae el username del query string
`?username=Invitado_XXXX` (generado por el frontend y guardado en `sessionStorage`).
Si no hay query string, el servidor genera uno aleatorio. Los invitados tienen `UserId = null`.

## Testing Strategy

| Capa | Qué testear | Enfoque |
|------|-------------|---------|
| Domain | `Room.ProcessTap` — false start, victoria, segundo tap ignorado, reactionMs | xUnit puro |
| Domain | `Room.MarkReady` — true solo cuando ambos | xUnit puro |
| Infrastructure | `MatchmakingService` — cola, emparejamiento, remove | xUnit puro |
| Application | `GetRankingUseCase` — mapeo de campos, orden preservado | xUnit + NSubstitute |
| — | Hub (SignalR) | Fuera de scope (requiere TestServer) |
| — | Repositorios Npgsql | Fuera de scope (requieren BD real) |

## Open Questions

- [x] **Segunda tap ignorado**: ProcessTap comprueba `tapper.HasTapped` antes de resolver — confirmado
- [x] **Loop cancelado en false start**: `roomService.CancelGameLoop` llamado en `SendTap` si hay resultado
- [x] **IHubContext vs Clients**: `IHubContext<GameHub>` inyectado en el Hub para uso en `Task.Run`
- [x] **Versiones NuGet**: todos `Microsoft.Extensions.*` fijados a 10.0.5 para evitar NU1605

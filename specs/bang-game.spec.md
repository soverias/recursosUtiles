---
status: partial
coverage:
  backend: implemented
  frontend: implemented
last_change: cross-cutting-spec-extraction
last_verified: 2026-05-16
pending: |
  - Aún no existe spec cross-cutting para `bot-opponent` (juego contra bot local) — solo vive en frontend
  - Aún no existe spec cross-cutting para `rematch-notification` — solo vive en frontend
  - El backend no implementa `bot-opponent` (es 100% frontend, no requiere contrato)
---

# Bang Game — Spec cross-cutting

Contrato observable entre frontend (Angular PWA en `frontend/projects/bang-game/`) y backend (.NET hub en `backend/src/BangGame/`). Este documento es la **única fuente de verdad del contrato**. Los specs locales describen el CÓMO de cada lado y referencian este documento para el QUÉ.

---

## 1. Identidad y autenticación

### Requirement: Dos tipos de identidad — registrada e invitada

El sistema MUST soportar dos tipos de jugador:

- **Registrado**: tiene cuenta con `username` único y `password`. Se autentica con JWT.
- **Invitado**: identidad efímera con `username` generado por el frontend (`Invitado_XXXX`), guardada en `sessionStorage`. Sin password ni cuenta persistente.

Los invitados MAY jugar partidas pero MUST NOT aparecer en el ranking ni dejar registro en `game_results`.

### REST contract — autenticación

| Endpoint | Método | Auth | Request body | Respuesta éxito | Respuesta error |
|----------|--------|------|--------------|-----------------|------------------|
| `/auth/register` | POST | No | `{ username: string, password: string }` | `201 { token: string, username: string }` | `409 { error: "Username no disponible" }` |
| `/auth/login` | POST | No | `{ username: string, password: string }` | `200 { token: string, username: string }` | `401 { error: "Credenciales inválidas" }` |

#### Reglas

- `token` es un JWT HS256 firmado con la clave del servidor.
- El password MUST almacenarse hasheado (PBKDF2-SHA256). Nunca en claro.
- El frontend persiste el JWT en `localStorage` para jugadores registrados.
- El frontend persiste el `Invitado_XXXX` en `sessionStorage` para invitados.

---

## 2. Conexión al hub SignalR

### Requirement: Hub único en `/hubs/game`

El frontend MUST conectarse al hub SignalR en la ruta `/hubs/game`. La identidad del jugador se transmite así:

- **Jugador registrado**: JWT en el header de la conexión (esquema estándar SignalR/`AccessTokenProvider`).
- **Jugador invitado**: query string `?username=Invitado_XXXX`.
- Si no hay ninguno de los dos, el servidor MUST generar un `Invitado_XXXX` aleatorio.

Los invitados tienen `UserId = null` internamente en el servidor.

---

## 3. Métodos del hub (cliente → servidor)

| Método | Parámetros | Descripción |
|--------|-----------|-------------|
| `JoinRandom()` | — | Encola al jugador en matchmaking aleatorio |
| `CreatePrivateRoom()` | — | Crea sala privada; emite `RoomCreated` solo al creador |
| `JoinPrivateRoom(code)` | `code: string` (6 chars) | Se une a sala por código |
| `SendReady()` | — | Marca al jugador como listo en la sala actual |
| `SendTap()` | — | Envía un tap; el servidor arbitra y emite `RoundResult` |
| `Repeat()` | — | Solicita revancha tras un resultado |
| `LeaveRoom()` | — | Abandona la sala actual |

---

## 4. Eventos del hub (servidor → cliente)

| Evento | Destinatario | Payload |
|--------|-------------|---------|
| `RoomCreated` | Solo creador | `{ roomId: string, code: string }` |
| `OpponentJoined` | Ambos jugadores de la sala | `{ roomId: string, opponentUsername: string }` |
| `BothReady` | Ambos | — (sin payload) |
| `CountdownStart` | Ambos | — |
| `Bang` | Ambos | — |
| `RoundResult` | Ambos | `{ winnerId: string, loserId: string, winnerReactionMs: number, loserReactionMs: number, isFalseStart: boolean }` |
| `OpponentLeft` | Jugador restante | — |
| `Error` | Solo invocador | `{ message: string }` |

#### Notas críticas del contrato

- **`winnerId` y `loserId` contienen el `username`, NO el `connectionId`.** El connectionId cambia en reconexión; el username es estable. El frontend compara `winnerId === currentUser.username` para saber si ha ganado.
- En `RoundResult`, si `isFalseStart === true`: `winnerReactionMs` y `loserReactionMs` SON 0 (no aplica medición). El `loserId` es quien hizo el tap prematuro.

---

## 5. Máquina de estados de la sala

```
WaitingOpponent ──(2º jugador se une)──► WaitingReady
WaitingReady    ──(ambos SendReady)────► Countdown
Countdown       ──(3000 ms)────────────► WaitingBang
WaitingBang     ──(retardo aleatorio)──► BangActive
Countdown       ──(tap recibido)───────► Result          [false start]
WaitingBang     ──(tap recibido)───────► Result          [false start]
BangActive      ──(tap recibido)───────► Result          [victoria legítima]
Result          ──(ambos Repeat)───────► WaitingReady
```

### Reglas de temporización

- **Countdown**: 3000 ms fijos. Visualmente el frontend muestra "Preparados" → "Listos".
- **WaitingBang**: retardo aleatorio uniforme entre **100 ms y 2000 ms** (oculto al jugador).
- **BangActive**: el servidor registra `bangTimestamp` cuando emite `Bang`. La diferencia con el tap del ganador es `winnerReactionMs`.

### Reglas de arbitraje

- El servidor es **árbitro absoluto**. El frontend NUNCA decide ganador/perdedor; sólo envía taps y refleja `RoundResult`.
- El **primer tap** durante `BangActive` resuelve la ronda. El segundo tap MUST ser ignorado (no emite eventos).
- Un tap durante `Countdown` o `WaitingBang` MUST resolverse como false start. El jugador que tapeó es el perdedor; el otro gana con tiempos `0/0`. El loop de partida en curso MUST cancelarse.
- El frontend MUST NOT bloquear el botón de tap en fases tempranas — el área tappable MUST estar disponible durante `Countdown`, `WaitingBang` y `BangActive`, sin huecos, para que el false start pueda producirse y ser arbitrado por el servidor.

---

## 6. Matchmaking

### Requirement: Cola in-memory FIFO

- `JoinRandom` encola al jugador.
- Cuando llega el segundo jugador a la cola, el servidor MUST emparejarlos inmediatamente, crearles una sala, añadirlos al grupo SignalR y emitir `OpponentJoined` a ambos con el `opponentUsername` correspondiente.
- Si el jugador se desconecta del hub mientras espera en cola, MUST eliminarse de la cola sin emitir eventos.

---

## 7. Salas privadas

### Requirement: Código alfanumérico de 6 caracteres

- `CreatePrivateRoom` genera un código alfanumérico único de **6 caracteres**.
- El servidor emite `RoomCreated({ roomId, code })` solo al creador.
- `JoinPrivateRoom(code)` añade al segundo jugador. Emite `OpponentJoined` a ambos.
- Código inválido, expirado o sala llena MUST emitir `Error({ message: "Sala no encontrada" })` solo al invocador.

---

## 8. Repetir partida y abandono

### Requirement: Repetir requiere consenso

- Tras `RoundResult`, ambos jugadores DEBEN llamar a `Repeat()` para iniciar nueva partida.
- Cuando ambos han pulsado, el servidor resetea la sala a `WaitingReady` y emite `BothReady` para iniciar el nuevo loop.
- Si solo uno ha pulsado, el otro MUST recibir notificación visual (gestión local del frontend — ver `frontend/projects/bang-game/rematch-notification.spec.md`).

### Requirement: Abandono limpio

- `LeaveRoom()` o desconexión MUST emitir `OpponentLeft` al jugador restante.
- Cualquier loop de partida en curso en esa sala MUST cancelarse.

---

## 9. Ranking

### REST contract — ranking

| Endpoint | Método | Auth | Respuesta |
|----------|--------|------|-----------|
| `/ranking` | GET | No | `200 [{ username: string, wins: number, avgReactionMs: number, winRatio: number }]` |

### Reglas

- El array MUST estar ordenado por `wins` descendente por defecto.
- `avgReactionMs` = media de `winner_reaction_ms` de las **victorias legítimas** (excluye false starts).
- `winRatio` = `wins / total_partidas_jugadas`.
- Los jugadores invitados MUST NOT aparecer en el ranking.
- Usuarios registrados sin partidas jugadas aparecen con `wins: 0, avgReactionMs: 0, winRatio: 0`.

---

## 10. Persistencia de partidas

### Requirement: Solo se guardan partidas entre registrados

- Tras emitir `RoundResult`, el servidor inserta una fila en `game_results` **únicamente si ambos jugadores tienen `UserId` no nulo** (ambos registrados).
- Si al menos uno de los jugadores es invitado, la partida MUST NOT guardarse.

### Schema de `game_results`

```sql
game_results (
  id UUID PK,
  winner_id UUID FK -> users(id),
  loser_id UUID FK -> users(id),
  winner_reaction_ms INT,
  loser_reaction_ms INT,
  is_false_start BOOLEAN,
  played_at TIMESTAMPTZ
)
```

---

## 11. Tipos compartidos

Estos tipos son la fuente de verdad del payload. Frontend y backend MUST mantener formas equivalentes (TypeScript en frontend, DTOs en backend).

```typescript
// payload de RoundResult
interface RoundResult {
  winnerId: string;            // username, no connectionId
  loserId: string;             // username, no connectionId
  winnerReactionMs: number;    // 0 si false start
  loserReactionMs: number;     // 0 siempre (no se mide)
  isFalseStart: boolean;
}

// payload de OpponentJoined / RoomCreated
interface RoomInfo {
  roomId: string;
  code?: string;               // solo presente en RoomCreated y en salas privadas
  opponentUsername?: string;   // presente en OpponentJoined
}

// fase de la sala (estado interno, no se transmite directamente — se infiere de los eventos)
type GamePhase =
  | 'idle'
  | 'waiting-opponent'
  | 'both-ready'
  | 'countdown'
  | 'waiting-bang'
  | 'bang-active'
  | 'result';
```

---

## Referencias

- Spec local frontend: `frontend/projects/bang-game/bang-game.spec.md` — UI, flujo de pantallas, componentes
- Spec local backend: `backend/src/BangGame/bang-game.spec.md` — escenarios de dominio, persistencia
- Design backend: `backend/src/BangGame/bang-game.design.md` — arquitectura DDD, máquina de estados interna, lock strategy
- Design frontend: `frontend/projects/bang-game/bang-game.design.md` — servicios Angular, guards, signals

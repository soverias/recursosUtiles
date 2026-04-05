# Design: bang-game

## Technical Approach

SPA Angular 21.2 con SignalR como único canal en tiempo real. El backend es árbitro absoluto: el frontend envía eventos (ready, tap) y recibe estados (countdown-start, bang, result). El estado de partida se modela como una máquina de estados con Signals. Rutas lazy-loaded con guards funcionales, siguiendo el patrón de secret-friend.

## Architecture Decisions

| Decisión | Elección | Alternativa descartada | Razón |
|----------|----------|------------------------|-------|
| Árbitro del juego | Backend determina ganador | Frontend compara timestamps | Elimina ventaja por latencia y falsificación |
| Estado de partida | Signal máquina de estados en `GameStateService` | NgRx/BehaviorSubject | Consistente con el resto del workspace; sin boilerplate |
| Auth storage | JWT en `localStorage`, invitado en `sessionStorage` | Cookie httpOnly | Backend independiente; simplifica CORS |
| Detección de false start | El frontend envía el tap siempre; el backend lo clasifica | Guard en frontend | Evitar race conditions; lógica en un solo lugar |
| Gesto único por ronda | Flag `tapConsumed` en `GameStateService` | Desuscribir listener | Más simple; evita re-registro de event listeners |

## Data Flow

```
Entry ──register/login──→ AuthService ──JWT──→ localStorage
Entry ──guest──────────→ AuthService ──UUID──→ sessionStorage

Lobby ──joinRandom──→ GameHubService ──SignalR──→ Backend
Lobby ──createPrivate→ GameHubService ──SignalR──→ Backend ──roomCode──→ GameStateService

GamePage ──ready──→ GameHubService ──SignalR──→ Backend
                                                    │
                               ◄──CountdownStart────┤
                               ◄──Bang──────────────┤
User tap ──────────→ GameHubService ──SignalR──→ Backend
                               ◄──RoundResult───────┘
                                  (winner, loser, reactionTimes)

ResultPage ──repeat/other──→ GameHubService ──SignalR──→ Backend
```

## Game State Machine

```
idle → waiting-opponent → both-ready → countdown → waiting-bang → bang-active → result
```

Gestionado por `GameStateService` (`signal<GamePhase>`). Cada transición llega del backend vía SignalR.

## File Changes

| Fichero | Acción | Descripción |
|---------|--------|-------------|
| `src/app/app.routes.ts` | Modify | Añadir rutas: entry, lobby, game, ranking |
| `src/app/app.config.ts` | Modify | Añadir `provideHttpClient(withInterceptors([authInterceptor]))` |
| `src/app/core/services/signalr.service.ts` | Create | Gestiona conexión SignalR (connect/disconnect/reconnect) |
| `src/app/core/services/game-hub.service.ts` | Create | Métodos del hub: joinRandom, joinPrivate, sendReady, sendTap, repeat, leaveRoom |
| `src/app/core/services/auth.service.ts` | Create | register, login, playAsGuest, logout; estado: `currentUser signal` |
| `src/app/core/interceptors/auth.interceptor.ts` | Create | Inyecta `Authorization: Bearer <token>` en requests HTTP |
| `src/app/core/guards/identity.guard.ts` | Create | Redirige a /entry si no hay identidad (auth ni guest) |
| `src/app/core/guards/in-room.guard.ts` | Create | Redirige a /lobby si no hay sala activa |
| `src/app/core/models/` | Create | `user.model.ts`, `room.model.ts`, `game-state.model.ts` |
| `src/app/pages/entry/entry.page.ts` | Create | Login + registro + botón invitado |
| `src/app/pages/lobby/lobby.page.ts` | Create | Matchmaking aleatorio + sala privada (crear/unirse) |
| `src/app/pages/game/game.page.ts` | Create | Orquesta fases del juego |
| `src/app/pages/game/game-state.service.ts` | Create | `signal<GamePhase>`, `tapConsumed`, métodos de transición |
| `src/app/pages/game/components/bang-button/` | Create | Área táctil principal; deshabilitada hasta fase bang-active |
| `src/app/pages/game/components/countdown/` | Create | Muestra cuenta atrás 3s |
| `src/app/pages/game/components/result/` | Create | Muestra ganador, tiempos de reacción, botones Repetir/Otro |
| `src/app/pages/ranking/ranking.page.ts` | Create | Tabla ordenable; datos vía HTTP GET /ranking |

## Interfaces / Contracts

```typescript
type GamePhase =
  | 'idle'
  | 'waiting-opponent'
  | 'both-ready'
  | 'countdown'
  | 'waiting-bang'
  | 'bang-active'
  | 'result';

interface RoundResult {
  winnerId: string;
  loserId: string;
  winnerReactionMs: number;
  loserReactionMs: number;
  isFalseStart: boolean;
}

interface RoomInfo {
  roomId: string;
  code?: string; // solo salas privadas
  opponentUsername: string;
}
```

## Testing Strategy

| Capa | Qué testear | Enfoque |
|------|------------|---------|
| Unit | `GameStateService` transiciones de fase; `AuthService` lógica de identidad; guards | Vitest + jsdom |
| Unit | Componentes: bang-button (deshabilitado/habilitado), result (winner/loser), countdown | TestBed Angular |
| Integration | `GameHubService` con SignalR mock | Vitest + stub de HubConnection |
| — | E2E | Fuera de scope (requiere backend real) |

## Migration / Rollout

No migration required. Proyecto nuevo, sin datos previos ni usuarios existentes.

## Open Questions

- [x] **Countdown**: el backend emite `CountdownStart` — toda la temporización es responsabilidad del servidor.
- [x] **Ranking**: REST (`GET /ranking`) — no requiere reactividad en tiempo real. Regla general: lo que no necesite tiempo real → REST.

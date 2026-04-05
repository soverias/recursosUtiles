# Tasks: bang-game

## Phase 1: Fundación — Modelos y configuración

- [x] 1.1 Crear `src/app/core/models/user.model.ts` — interfaces `User`, `GuestUser`, `AuthState`
- [x] 1.2 Crear `src/app/core/models/room.model.ts` — interfaces `RoomInfo`, `RoundResult`
- [x] 1.3 Crear `src/app/core/models/game-state.model.ts` — tipo `GamePhase` (7 estados)
- [x] 1.4 Modificar `src/app/app.config.ts` — añadir `provideHttpClient(withInterceptors([authInterceptor]))`

## Phase 2: Servicios core (TDD — RED→GREEN)

- [x] 2.1 RED: tests de `AuthService` — register, login, playAsGuest, logout, persistencia en localStorage/sessionStorage
- [x] 2.2 GREEN: crear `src/app/core/services/auth.service.ts` con `currentUser = signal<AuthState>`
- [x] 2.3 Crear `src/app/core/interceptors/auth.interceptor.ts` — inyecta `Authorization: Bearer` si hay JWT
- [x] 2.4 RED: tests de `SignalRService` — connect, disconnect, estado de conexión como signal
- [x] 2.5 GREEN: crear `src/app/core/services/signalr.service.ts` usando `@microsoft/signalr`
- [x] 2.6 RED: tests de `GameHubService` con stub de `HubConnection` — joinRandom, joinPrivate, sendReady, sendTap, repeat, leaveRoom
- [x] 2.7 GREEN: crear `src/app/core/services/game-hub.service.ts`

## Phase 3: Estado de partida (TDD — RED→GREEN)

- [x] 3.1 RED: tests de `GameStateService` — transiciones de fase (idle→waiting-opponent→…→result), flag `tapConsumed`, reset
- [x] 3.2 GREEN: crear `src/app/pages/game/game-state.service.ts` con `phase = signal<GamePhase>`, métodos de transición
- [x] 3.3 RED: tests de guards — `identity.guard` redirige a /entry sin identidad; `in-room.guard` redirige a /lobby sin sala
- [x] 3.4 GREEN: crear `src/app/core/guards/identity.guard.ts` e `in-room.guard.ts`

## Phase 4: Páginas y componentes (TDD — RED→GREEN)

- [x] 4.1 RED: tests de `EntryPage` — muestra form login/registro, botón invitado; scenario "username ya en uso" → error visible
- [x] 4.2 GREEN: crear `src/app/pages/entry/entry.page.ts`
- [x] 4.3 RED: tests de `LobbyPage` — botón "Jugar ahora" llama joinRandom; "Crear sala privada" muestra código; "Unirse" con código inválido muestra error
- [x] 4.4 GREEN: crear `src/app/pages/lobby/lobby.page.ts`
- [x] 4.5 RED: tests de `BangButtonComponent` — deshabilitado en fases != bang-active; emite evento al tap en fase bang-active; no emite doble tap (tapConsumed)
- [x] 4.6 GREEN: crear `src/app/pages/game/components/bang-button/bang-button.component.ts`
- [x] 4.7 RED: tests de `CountdownComponent` — muestra 3, 2, 1; emite `countdownEnd` al llegar a 0
- [x] 4.8 GREEN: crear `src/app/pages/game/components/countdown/countdown.component.ts`
- [x] 4.9 RED: tests de `ResultComponent` — muestra ganador/perdedor, tiempos de reacción, false start; emite `repeat` y `playOther`
- [x] 4.10 GREEN: crear `src/app/pages/game/components/result/result.component.ts`
- [x] 4.11 RED: tests de `GamePage` — renderiza componente correcto por fase; llama sendReady al marcar listo
- [x] 4.12 GREEN: crear `src/app/pages/game/game.page.ts`
- [x] 4.13 RED: tests de `RankingPage` — renderiza tabla con datos mock; ordena por columna al clicar cabecera; invitados no aparecen
- [x] 4.14 GREEN: crear `src/app/pages/ranking/ranking.page.ts` con `httpResource` para GET /ranking

## Phase 5: Integración y cableado

- [x] 5.1 Modificar `src/app/app.routes.ts` — rutas lazy: `/entry`, `/lobby`, `/game`, `/ranking` con guards
- [x] 5.2 Modificar `src/app/app.ts` — eliminar title signal; añadir `RouterOutlet` en template
- [x] 5.3 Verificar que `ng test --project bang-game --watch=false` pasa todos los tests ✅ 85/85

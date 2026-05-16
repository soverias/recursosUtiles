# Tasks: bot-opponent

## Fase 1 — Modelos

- [x] 1.1 📌 Crear `bot.model.ts` con `BotDifficulty`, `BotDifficultyConfig` y `BOT_DIFFICULTY_CONFIGS` (easy / medium / hard con rangos de reacción y nombres de bot)

## Fase 2 — BotSessionService

- [x] 2.1 📌 Implementar `BotSessionService` + tests: signals `isBotGame`, `difficulty`, computed `opponentName`; métodos `startBotSession(difficulty)` y `endBotSession()`
- [x] 2.2 Tests: `startBotSession()` activa `isBotGame` y almacena difficulty; `endBotSession()` resetea ambos a defaults; `opponentName` computed devuelve el nombre correcto según difficulty

## Fase 3 — MatchmakingTimeoutService

- [x] 3.1 📌 Implementar `MatchmakingTimeoutService` + tests: signal `expired`, métodos `start(ms)` y `cancel()`
- [x] 3.2 Tests con `vi.useFakeTimers()`: `expired` es `false` antes del timeout; pasa a `true` exactamente a los `durationMs`; `cancel()` resetea `expired` a `false` y limpia el timer; llamada a `start()` mientras hay timer activo cancela el anterior

## Fase 4 — BotGameService

- [x] 4.1 📌 Crear esqueleto de `BotGameService` con inyección de `BotSessionService` y `GameStateService`; handles de timers privados y `reset()` que cancela todos los timers
- [x] 4.2 Implementar `startGame()` + tests: llama `gameState.opponentJoined()` con roomId `'bot-room'` y `opponentUsername` del `opponentName` computado; transiciona a `waiting-opponent`
- [x] 4.3 Implementar `playerReady()` + tests: programa delay (300–800 ms) y llama `gameState.bothReady()`; tras 1000 ms adicionales llama `gameState.countdownStart()`; verificar con `vi.advanceTimersByTime()`
- [x] 4.4 Implementar fase countdown → waiting-bang + tests: tras 2500 ms desde `countdownStart` llama `gameState.waitingBang()`; si dificultad `hard` puede programar false start del bot con probabilidad configurable
- [x] 4.5 Implementar waiting-bang → bang-active + tests: delay aleatorio (1500–4000 ms), llama `gameState.bang()`, registra `_bangTimestamp`, llama `scheduleBotTap()`; `Math.random()` mockeado para determinismo
- [x] 4.6 Implementar `scheduleBotTap()` + tests: precalcula `botReactionMs` según config de dificultad; si el timer expira sin tap del jugador → `gameState.roundResult({ winner: 'bot' })`; rangos correctos para easy / medium / hard
- [x] 4.7 Implementar `playerTapped()` — tap válido + tests: cancela timer del bot; calcula `playerReactionMs = now - _bangTimestamp`; llama `gameState.roundResult()` con `winner = 'player'` y tiempo de reacción; `Date.now()` mockeado
- [x] 4.8 Implementar `playerTapped()` — false start del jugador + tests: si fase es `waiting-bang`, cancela timers, llama `gameState.roundResult({ isFalseStart: true, winner: 'bot' })`
- [x] 4.9 Implementar `rematch()` + tests: llama `gameState.opponentWantsRematch()`, limpia timers internos y re-invoca `startGame()` sin modificar `BotSessionService`; no emite ningún evento SignalR
- [x] 4.10 Implementar `abandon()` + tests: llama `reset()` y `gameState.reset()`; verifica que no quedan timers activos ni llamadas a `GameHubService`

## Fase 5 — BotDifficultyPickerComponent

- [x] 5.1 📌 Crear `BotDifficultyPickerComponent` standalone + tests: renderiza tres botones (fácil / medio / difícil) con `data-difficulty` attribute; emite `selected` output con la dificultad al hacer click; ninguna dificultad preseleccionada

## Fase 6 — LobbyPage

- [x] 6.1 Añadir inyecciones `BotSessionService` y `MatchmakingTimeoutService` en `LobbyPage`; importar `BotDifficultyPickerComponent`
- [x] 6.2 Llamar `botSession.endBotSession()` en `ngOnInit` como red de seguridad al volver del juego
- [x] 6.3 Integrar `matchmakingTimeout.start(30_000)` en `joinRandom()` y `matchmakingTimeout.cancel()` en el handler `OpponentJoined`
- [x] 6.4 Implementar `startBotGame(difficulty)` + tests: cancela timeout, llama `startBotSession(difficulty)`, navega a `/game`; si estaba en cola, cancela cola antes de navegar
- [x] 6.5 Tests de timeout: tras 30 s el signal `expired()` es true y la oferta de bot aparece en el template; si llega `OpponentJoined`, la oferta desaparece y `isBotGame` permanece false
- [x] 6.6 Añadir sección "Jugar contra bot" permanente en template con `<app-bot-difficulty-picker>`; añadir bloque `@if (matchmakingTimeout.expired())` con oferta de bot en la sección de matchmaking
- [x] 6.7 Tests: botón/picker visible en estado inicial del lobby; visible mientras está en cola; oferta de timeout desaparece al rechazarla (cancelar timeout y resetear `expired`)

## Fase 7 — GamePage

- [x] 7.1 Añadir inyecciones `BotSessionService` y `BotGameService` en `GamePage`
- [x] 7.2 Añadir bifurcación en `ngOnInit`: si `botSession.isBotGame()` → llamar `botGame.startGame()` y retornar sin registrar handlers SignalR
- [x] 7.3 Añadir branching bot/humano en `onReady()`, `onTap()`, `onRepeat()` y `onPlayOther()` según diseño
- [x] 7.4 Implementar `ngOnDestroy` + tests: si `isBotGame`, llama `botGame.reset()` y `botSession.endBotSession()`; verifica que no quedan timers activos
- [x] 7.5 Tests modo bot en `GamePage`: `ngOnInit` en modo bot no llama a `GameHubService`; `onTap()` delega a `botGame.playerTapped()`; `onRepeat()` delega a `botGame.rematch()`; `onPlayOther()` llama `botGame.abandon()` y navega a `/lobby`
- [x] 7.6 Tests de exclusión del ranking: en modo bot, ningún método de `GamePage` ni `BotGameService` llama a `GameHubService` para reportar resultado o revancha

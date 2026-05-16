# Proposal: bot-opponent

**Change**: bot-opponent  
**Project**: recursosutiles / bang-game  
**Date**: 2026-04-05  
**Status**: draft

---

## 1. Intent

Permitir que los jugadores de Bang Game puedan disputar partidas contra un bot local cuando no hay oponente humano disponible. El objetivo es eliminar la fricción de esperar en cola indefinidamente: el jugador podrá activar el bot automáticamente tras un timeout de matchmaking, o bien iniciarlo de forma manual desde el lobby. El bot vive íntegramente en el frontend y no reporta resultados al servidor, por lo que no afecta el ranking ni la lógica de negocio existente.

---

## 2. Scope

### Dentro del alcance

- Botón "Jugar contra bot" en el lobby (acceso manual, con selector de dificultad).
- Activación automática del bot tras un timeout configurable en la cola de matchmaking aleatorio (con oferta visual al usuario antes de activarlo).
- Tres niveles de dificultad: fácil, medio, difícil (rangos de tiempo de reacción distintos).
- Simulación completa del ciclo de juego (waiting-opponent → both-ready → countdown → waiting-bang → bang-active → result) en el frontend, sin cambios en el backend.
- Soporte para revancha contra el bot (mismo servicio, nuevo round).
- Compatible con sala privada (el host puede activar bot si espera solo).
- Las partidas contra bot NO se reportan al servidor ni afectan al ranking.

### Fuera del alcance (ver sección 6)

- Cambios en el backend .NET/SignalR.
- IA adaptativa, aprendizaje o historial de partidas contra bot.
- Leaderboard separado para partidas contra bot.
- Modo multijugador mixto (bot + jugador humano en la misma sala).

---

## 3. Approach

### Contexto: flujo actual

El flujo actual depende completamente de eventos SignalR emitidos por el servidor:

```
LobbyPage            GamePage                   GameHubService (SignalR)
   |                    |                               |
joinRandom() ──────────────────────────────────► JoinRandom
                        |◄── OpponentJoined ────────────|
                   navigate(/game)                      |
                        |◄── BothReady ─────────────────|
                        |◄── CountdownStart ────────────|
                        |◄── WaitingBang ───────────────|
                        |◄── Bang ──────────────────────|
                        |◄── RoundResult ───────────────|
```

`GamePage` registra handlers en `GameHubService.on(event, handler)` y delega el estado en `GameStateService`. `GameStateService` es quien posee las transiciones de fase y los signals que consume la UI.

### Opciones evaluadas

#### Opción A: `BotGameService` como adaptador que implementa la interfaz de `GameHubService`

Extraer una interfaz `IGameHubService` con los métodos `on`, `connect`, `disconnect`, `joinRandom`, `sendReady`, `sendTap`, `repeat`, `leaveRoom`. `BotGameService` implementaría la misma interfaz simulando los eventos. `GamePage` y `LobbyPage` se inyectarían vía token (`InjectionToken`) y cambiarían de implementación según el modo de juego.

- **Pro**: sustitución limpia; `GamePage` no cambia nada de su lógica interna.
- **Contra**: requiere extraer una interfaz de `GameHubService` (refactor en fichero existente), gestionar la inyección condicional en runtime (Angular no permite cambiar providers por instancia fácilmente sin workarounds como `Injector.create`), y los componentes de lobby necesitarían lógica para "pivotar" el provider antes de navegar — lo que añade complejidad de bootstrapping.

#### Opción B: `BotGameService` independiente que llama directamente a `GameStateService` ✅ ELEGIDA

`BotGameService` es un servicio autónomo con su propio ciclo de vida. No necesita imitar la interfaz de `GameHubService`. Cuando el modo bot está activo, `GamePage` observa un flag `isBotGame` del nuevo `BotSessionService` (o directamente de un signal en `BotGameService`) y delega las acciones del usuario (`onReady`, `onTap`, `onRepeat`) a `BotGameService` en lugar de `GameHubService`. `BotGameService` llama directamente a los métodos de `GameStateService` para avanzar las fases, replicando la misma secuencia de transiciones que haría el servidor.

- **Pro**: no requiere refactor de `GameHubService`; la interfaz de `GameHubService` permanece intacta; el bot es totalmente independiente del transporte SignalR; fácil de testear de forma aislada.
- **Contra**: `GamePage` necesita un pequeño bloque condicional para distinguir si está en modo bot o en modo normal. Es un cambio acotado y claro.

#### Opción C: Bot como middleware/interceptor de `SignalRService`

Interceptar las llamadas al hub antes de que lleguen al servidor e inyectar respuestas simuladas. Muy complejo, frágil y difícil de mantener. **Descartada**.

### Decisión: Opción B

La Opción B es la más limpia para este proyecto porque:
1. No toca `GameHubService` ni `SignalRService`.
2. El acoplamiento está bien delimitado: `BotGameService` → `GameStateService`.
3. `GamePage` solo necesita saber si está en modo bot para redirigir las acciones del usuario al servicio correcto.
4. Es fácil de testear con `vi.useFakeTimers` (sin zone.js).

---

## 4. Component Breakdown

### Nuevos

| Artefacto | Tipo | Responsabilidad |
|---|---|---|
| `BotGameService` | `@Injectable` | Orquesta el ciclo de juego del bot: simula los eventos del servidor (BothReady, CountdownStart, WaitingBang, Bang, RoundResult) con timers internos. Calcula el tiempo de reacción del bot según la dificultad. Llama a `GameStateService` directamente. |
| `BotSessionService` | `@Injectable` | Estado de sesión bot: `signal<boolean> isBotGame`, `signal<BotDifficulty> difficulty`. Coordina la activación desde el lobby y el acceso desde `GamePage`. Evita que el estado bot quede disperso entre componentes. |
| `BotDifficulty` | `type` (modelo) | `'easy' \| 'medium' \| 'hard'` — exportado desde `game-state.model.ts` o un nuevo `bot.model.ts`. |
| `BotDifficultyPickerComponent` | standalone component | UI de selección de dificultad (3 botones). Se usa en el lobby antes de iniciar partida bot. |
| `MatchmakingTimeoutService` | `@Injectable` | Gestiona el countdown de timeout en la cola aleatoria. Emite un evento cuando se agota. `LobbyPage` lo escucha para ofrecer el bot. |

### Modificados

| Artefacto | Cambio |
|---|---|
| `LobbyPage` | Añade botón "Jugar contra bot" con `BotDifficultyPickerComponent`. Integra `MatchmakingTimeoutService` para el timeout automático. Al activar bot, llama a `BotSessionService.startBotSession(difficulty)` y navega a `/game`. |
| `GamePage` | Lee `botSessionService.isBotGame()`. En modo bot: `onReady()` llama a `botGameService.start()`, `onTap()` a `botGameService.playerTapped()`, `onRepeat()` a `botGameService.rematch()`, `onPlayOther()` a `botGameService.abandon()`. En modo normal: comportamiento actual sin cambios. |
| `game-state.model.ts` | Exportar `BotDifficulty` type (o nuevo fichero `bot.model.ts`). |

### No modificados

- `GameHubService`, `SignalRService`, `GameStateService` (solo lectura desde bot), `CountdownComponent`, `BangButtonComponent`, `ResultComponent`.

---

## 5. Bot Difficulty Model

El bot simula el tiempo que tarda en "pulsar" el botón BANG tras la señal. Los rangos son:

| Dificultad | Retraso mínimo (ms) | Retraso máximo (ms) | Descripción |
|---|---|---|---|
| `easy` | 800 | 1800 | Reacción lenta y predecible. El jugador promedio siempre gana. |
| `medium` | 350 | 750 | Reacción razonable. Resultado incierto para la mayoría de jugadores. |
| `hard` | 80 | 250 | Reacción muy rápida. Solo un jugador con buenos reflejos puede ganar. |

**Implementación**: `BotGameService` usa `setTimeout(botReactionMs)` donde `botReactionMs = random(min, max)` para la dificultad activa. El cálculo del tiempo de reacción del jugador es la diferencia entre `Bang` emitido y `playerTapped()` llamado. `RoundResult` se construye localmente sin llamada al servidor.

**False start**: si el jugador pulsa durante `waiting-bang` (antes de la señal Bang), el bot gana automáticamente con `isFalseStart: true`, independientemente de la dificultad.

---

## 6. Out of Scope

- Ningún cambio en el backend .NET/SignalR/hubs.
- Integración con ranking/leaderboard del servidor (las partidas bot son locales).
- IA adaptativa o ajuste dinámico de dificultad.
- Persistencia de estadísticas de partidas contra bot.
- Modo espectador o replay de partidas bot.
- Bot en modo multijugador (más de 2 jugadores).
- Animaciones o avatares específicos para el bot.

---

## 7. Risks

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Timers en tests**: `setInterval`/`setTimeout` en `BotGameService` y `GameStateService` son sincrónicos con `vi.useFakeTimers`. Si se mezcla con async/await real puede haber race conditions en tests. | Media | Medio | Usar siempre `vi.useFakeTimers` en los tests del bot. Documentarlo en el spec. |
| **Estado bot no limpiado**: si el usuario abandona mitad del juego (navega atrás, recarga), `BotSessionService.isBotGame` puede quedar en `true`. | Alta | Bajo | `BotSessionService.clear()` llamado en `GamePage.ngOnDestroy` y en `LobbyPage.ngOnInit`. |
| **Colisión de fase**: si el jugador está en cola humana y simultáneamente activa el bot (doble click rápido), podrían lanzarse dos flujos. | Baja | Alto | `MatchmakingTimeoutService` debe cancelar la cola SignalR antes de activar el bot. `LobbyPage` deshabilita botones durante transición. |
| **False start no detectado correctamente**: el cliente no tiene confirmación del servidor para determinar false start; la lógica debe ser local y consistente. | Baja | Bajo | La detección de false start es idéntica a la del servidor: tap durante `waiting-bang` = false start. El bot siempre gana ese round. |
| **`GamePage` se vuelve complejo**: añadir el bloque condicional bot/humano puede hacer la clase difícil de mantener. | Baja | Medio | Mantener el bloque condicional acotado a los 4 métodos de acción (`onReady`, `onTap`, `onRepeat`, `onPlayOther`). No duplicar lógica de UI. |

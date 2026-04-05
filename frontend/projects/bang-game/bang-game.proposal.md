# Proposal: bang-game

## Intent

Construir la aplicación frontend del juego Bang Game: dos jugadores compiten en reflejos pulsando en pantalla en cuanto aparece la señal BANG. El primero en pulsar gana; pulsar antes pierde. Incluye salas aleatorias, salas privadas, y ranking de jugadores registrados.

## Scope

### In Scope
- Autenticación opcional: registro (username + password, sin email) o juego como invitado
- Sala aleatoria: matchmaking con cualquier jugador en espera
- Sala privada: crear sala con código compartible, unirse mediante código
- Flujo de partida: ambos listos → countdown 3s → retardo aleatorio 100-1000ms → BANG → primer toque gana / toque anticipado pierde
- Resultados post-partida: "Repetir" (ambos aceptan → nueva ronda) y "Jugar con otro"
- Ranking público: victorias totales, tiempo de reacción medio, ratio victorias/partidas
- Comunicación en tiempo real con backend vía SignalR
- PWA instalable

### Out of Scope
- Backend (repositorio independiente)
- Chat entre jugadores
- Torneos o brackets
- Historial detallado de partidas

## Capabilities

### New Capabilities
- `auth`: Registro y login opcionales (username + password). Invitados juegan sin cuenta, no rankean.
- `matchmaking`: Sala aleatoria — empareja al jugador con cualquier otro en espera.
- `private-room`: Sala privada — genera código, comparte enlace, el amigo se une por código.
- `game-session`: Flujo completo de partida: ready state, countdown, señal BANG, detección de reacción, false start, resultado.
- `ranking`: Tabla pública ordenable por victorias, tiempo medio de reacción y ratio.

### Modified Capabilities
- None

## Approach

SPA Angular con SignalR para toda la coordinación en tiempo real (sincronía del juego, eventos BANG, resultados). El estado de partida se gestiona con Signals. La lógica de temporización (countdown + retardo aleatorio) es responsabilidad del backend; el frontend solo recibe eventos y registra timestamps de interacción.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `projects/bang-game/src/app/` | New | Toda la aplicación |
| `projects/bang-game/src/app/auth/` | New | Registro, login, estado de sesión |
| `projects/bang-game/src/app/lobby/` | New | Matchmaking y salas privadas |
| `projects/bang-game/src/app/game/` | New | Flujo de partida y componente BANG |
| `projects/bang-game/src/app/ranking/` | New | Tabla de ranking |
| `projects/bang-game/src/app/core/` | New | SignalR service, auth service, HTTP interceptors |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Latencia diferente entre jugadores afecta la equidad | Med | El backend es árbitro; el frontend solo reporta timestamp relativo al evento recibido |
| Gestos fantasma en móvil (touchstart duplicado) | Low | Capturar un único evento por ronda con flag de consumido |

## Rollback Plan

La app es un proyecto Angular independiente. Revertir: `git revert` o eliminar `projects/bang-game/src/app/` sin afectar a `store` ni `secret-friend`.

## Dependencies

- Backend Bang Game desplegado con SignalR hub activo
- `@microsoft/signalr` instalado en el workspace

## Success Criteria

- [ ] Dos jugadores en la misma sala completan una partida de principio a fin
- [ ] El ganador se determina correctamente (incluida detección de false start)
- [ ] El flujo "Repetir" reinicia la partida sin recargar
- [ ] El ranking muestra datos reales de jugadores registrados
- [ ] La app es instalable como PWA

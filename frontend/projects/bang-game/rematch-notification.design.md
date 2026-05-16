# Design: rematch-notification

## Decisiones técnicas

### 1. Estado `opponentWantsRepeat` en `GameStateService`

Se añade un signal `opponentWantsRepeat = signal(false)` al servicio existente.
Se añade el método `opponentWantsRematch()` que lo pone a `true`.
Se resetea a `false` en `reset()` y en `waitingRematch()` (cuando el propio jugador confirma).

**Por qué**: el estado vive en el servicio, no en el componente, para que sea testeable de forma aislada y coherente con el resto de signals del servicio.

### 2. Listener `OpponentWantsRematch` en `GamePage`

En `ngOnInit`, se registra:

```ts
this.hub.on<void>('OpponentWantsRematch', () => this.gameState.opponentWantsRematch());
```

No se necesita ningún cambio en la fase del receptor: sigue en `result`.

### 3. Input `opponentWantsRepeat` en `ResultComponent`

`ResultComponent` recibe un nuevo input `opponentWantsRepeat = input.required<boolean>()`.

Cuando es `true`, muestra un banner sobre los botones:

```
┌─────────────────────────────────────────┐
│ 🔔 Tu oponente quiere repetir           │
└─────────────────────────────────────────┘
```

El banner no bloquea los botones. El botón "Repetir" puede destacarse visualmente (color más brillante o animación pulse) para incitar al jugador a actuar.

### 4. Reset del signal

- `waitingRematch()` → resetea `opponentWantsRepeat` a `false` (el propio jugador confirmó; ya no es relevante mostrar el aviso)
- `reset()` → resetea `opponentWantsRepeat` a `false`

### 5. Sin cambios en el protocolo de rematch

El flujo `BothReady` permanece intacto. Este change es puramente de presentación en el receptor.

## Contrato SignalR (backend)

| Evento | Dirección | Payload | Cuándo |
|--------|-----------|---------|--------|
| `OpponentWantsRematch` | Servidor → cliente | `void` | Cuando un jugador envía `repeat` y el oponente aún no lo ha hecho |

El backend ya recibe `repeat` del hub existente. Solo necesita añadir la emisión de `OpponentWantsRematch` al otro jugador de la sala cuando procesa ese mensaje.

## Ficheros afectados

| Fichero | Tipo de cambio |
|---------|---------------|
| `game-state.model.ts` | Sin cambios (no hay nueva fase) |
| `game-state.service.ts` | Añadir signal + método + reset |
| `game.page.ts` | Añadir listener `OpponentWantsRematch` + pasar input al componente |
| `result.component.ts` | Añadir input + banner condicional |
| `game-state.service.spec.ts` | Tests del signal y método |
| `result.component.spec.ts` | Tests del banner condicional |

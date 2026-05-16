# Design: bot-opponent

**Change**: bot-opponent  
**Project**: recursosutiles / bang-game  
**Date**: 2026-04-05  
**Status**: draft  
**Proposal**: `bot-opponent.proposal.md`

---

## 1. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                        LobbyPage                            │
│  ┌──────────────────┐  ┌────────────────────────────────┐   │
│  │ "Jugar contra bot"│  │  Matchmaking aleatorio         │   │
│  │ + DifficultyPicker│  │  ┌──────────────────────────┐  │   │
│  └────────┬─────────┘  │  │ MatchmakingTimeoutService │  │   │
│           │             │  └────────────┬─────────────┘  │   │
│           │             └───────────────┼────────────────┘   │
│           ▼                             ▼                    │
│   BotSessionService.startBotSession(difficulty)              │
│           │                                                  │
│           ▼  navigate('/game')                               │
└───────────┼──────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                        GamePage                              │
│                                                              │
│   ┌─ if botSession.isBotGame() ──────────────────────┐      │
│   │                                                   │      │
│   │  onReady()  → botGame.playerReady()               │      │
│   │  onTap()    → botGame.playerTapped()              │      │
│   │  onRepeat() → botGame.rematch()                   │      │
│   │  onLeave()  → botGame.abandon()                   │      │
│   │                                                   │      │
│   └───────────────────────────────────────────────────┘      │
│   ┌─ else (modo humano, sin cambios) ────────────────┐      │
│   │  onReady()  → hub.sendReady()                     │      │
│   │  onTap()    → hub.sendTap()                       │      │
│   │  onRepeat() → hub.repeat()                        │      │
│   │  onLeave()  → hub.leaveRoom()                     │      │
│   └───────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘

Servicios nuevos y sus dependencias:

  BotSessionService (root)
        │
        ▼
  BotGameService (root)
    ├── inject(BotSessionService)  → lee difficulty, opponentName
    └── inject(GameStateService)   → llama opponentJoined, bothReady,
                                     countdownStart, waitingBang, bang,
                                     roundResult, opponentWantsRematch, reset

  MatchmakingTimeoutService (root)
        └── standalone, sin dependencias de dominio

Servicios NO modificados:
  - GameHubService
  - SignalRService
  - GameStateService (solo se añade lectura de isBotGame, ver §3)
```

---

## 2. Nuevos artefactos

### 2.1 `BotDifficulty` — tipo

**Fichero**: `projects/bang-game/src/app/core/models/bot.model.ts`

```typescript
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotDifficultyConfig {
  readonly label: string;
  readonly botName: string;
  readonly minReactionMs: number;
  readonly maxReactionMs: number;
}

export const BOT_DIFFICULTY_CONFIGS: Record<BotDifficulty, BotDifficultyConfig> = {
  easy:   { label: 'Fácil',   botName: 'Disparo Fácil', minReactionMs: 600, maxReactionMs: 1200 },
  medium: { label: 'Medio',   botName: 'Pistolero',     minReactionMs: 300, maxReactionMs: 600  },
  hard:   { label: 'Difícil', botName: 'El Rápido',     minReactionMs: 150, maxReactionMs: 300  },
};
```

**Decisiones**:
- Se exporta como fichero separado (`bot.model.ts`) en lugar de añadirlo a `game-state.model.ts` para mantener la separación de conceptos. El bot es una feature independiente.
- `BOT_DIFFICULTY_CONFIGS` centraliza los rangos de reacción y los nombres de bot en un solo lugar, evitando constantes mágicas dispersas.
- Los nombres del bot varían según dificultad para darle personalidad: "Disparo Fácil" (easy), "Pistolero" (medium), "El Rápido" (hard).

---

### 2.2 `BotSessionService`

**Fichero**: `projects/bang-game/src/app/core/services/bot-session.service.ts`  
**providedIn**: `'root'`

```typescript
@Injectable({ providedIn: 'root' })
export class BotSessionService {
  readonly isBotGame = signal(false);
  readonly difficulty = signal<BotDifficulty>('medium');
  readonly opponentName = computed(() =>
    BOT_DIFFICULTY_CONFIGS[this.difficulty()].botName
  );

  startBotSession(difficulty: BotDifficulty): void {
    this.difficulty.set(difficulty);
    this.isBotGame.set(true);
  }

  endBotSession(): void {
    this.isBotGame.set(false);
    this.difficulty.set('medium');
  }
}
```

**Responsabilidad**: estado de sesión puro. No contiene lógica de juego. Es la fuente de verdad para saber si estamos en modo bot y con qué dificultad.

**Justificación de `providedIn: 'root'`**: el estado de sesión bot debe sobrevivir la navegación entre LobbyPage y GamePage. Si fuese instanciado por GamePage, LobbyPage no podría activarlo antes de navegar.

---

### 2.3 `BotGameService`

**Fichero**: `projects/bang-game/src/app/core/services/bot-game.service.ts`  
**providedIn**: `'root'`

#### Dependencias inyectadas
- `BotSessionService` — lee `difficulty()`, `opponentName()`
- `GameStateService` — llama sus métodos para transitar fases

#### API pública

```typescript
@Injectable({ providedIn: 'root' })
export class BotGameService {
  private readonly botSession = inject(BotSessionService);
  private readonly gameState  = inject(GameStateService);

  // Handles de timers activos (para cancelación y testabilidad)
  private _readyTimeoutId:     ReturnType<typeof setTimeout> | null = null;
  private _countdownTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _bangDelayId:        ReturnType<typeof setTimeout> | null = null;
  private _botTapTimeoutId:    ReturnType<typeof setTimeout> | null = null;

  // Timestamp del momento en que se emite BANG (para calcular reacción del jugador)
  private _bangTimestamp = 0;

  /** Arranca la partida bot: simula OpponentJoined */
  startGame(): void;

  /** El jugador pulsó "¡Listo!" */
  playerReady(): void;

  /** El jugador pulsó el botón de disparo (tap) */
  playerTapped(): void;

  /** Revancha contra el mismo bot */
  rematch(): void;

  /** Abandonar partida bot */
  abandon(): void;

  /** Cancela todos los timers activos y resetea estado interno */
  reset(): void;
}
```

#### Ciclo de vida completo

```
startGame()
  │
  ├─ gameState.opponentJoined({ roomId: 'bot-room', opponentUsername, myUsername })
  │  → phase: 'waiting-opponent'
  │
  ▼
playerReady()                          [jugador pulsa "¡Listo!"]
  │
  ├─ setTimeout(300-800ms)             [bot "piensa" si está listo]
  │    └─ gameState.bothReady()
  │       → phase: 'both-ready'
  │
  ├─ setTimeout(1000ms after bothReady)
  │    └─ gameState.countdownStart()
  │       → phase: 'countdown'
  │       → GameStateService gestiona "Preparados", "Listos" con su propio setInterval
  │
  ├─ setTimeout(2500ms after countdownStart)  [duración del countdown: 2 pasos × 1s + 500ms]
  │    └─ gameState.waitingBang()
  │       → phase: 'waiting-bang'
  │
  ├─ setTimeout(random 1500-4000ms after waitingBang)  [tensión aleatoria]
  │    └─ gameState.bang()
  │       → phase: 'bang-active'
  │       → _bangTimestamp = Date.now()
  │       → scheduleBotTap()
  │
  ▼
scheduleBotTap()
  │
  └─ botReactionMs = random(config.minReactionMs, config.maxReactionMs)
     setTimeout(botReactionMs)
       └─ si phase === 'bang-active' && !tapConsumed:
            → bot gana (jugador no reaccionó a tiempo)
            → gameState.roundResult({ winner: 'bot', ... })

playerTapped()                         [jugador pulsa durante la partida]
  │
  ├─ if phase === 'waiting-bang':      [FALSE START]
  │    cancelar _bangDelayId
  │    cancelar _botTapTimeoutId
  │    gameState.consumeTap()
  │    gameState.roundResult({ isFalseStart: true, winner: bot })
  │
  ├─ if phase === 'bang-active':       [TAP VÁLIDO]
  │    playerReactionMs = Date.now() - _bangTimestamp
  │    cancelar _botTapTimeoutId
  │    gameState.consumeTap()
  │    if playerReactionMs < botReactionMs:
  │      gameState.roundResult({ winner: player, ... })
  │    else:
  │      gameState.roundResult({ winner: bot, ... })
  │
  └─ if phase === 'countdown':         [tap durante countdown → ignorar o false start]
       gameState.consumeTap()
       → NO es false start (el servidor tampoco lo penaliza durante countdown)

rematch()
  │
  ├─ gameState.opponentWantsRematch()  [simula que el bot quiere revancha]
  ├─ gameState.waitingRematch() se llama desde GamePage antes de rematch()
  ├─ reset timers internos
  └─ startGame() con misma dificultad  [reinicia el ciclo]

abandon()
  │
  ├─ reset()
  └─ gameState.reset()
```

#### Gestión de `_botReactionMs` precalculado

Al entrar en `bang-active`, se precalcula `_botReactionMs` y se agenda el timer del bot. Si el jugador toca antes de que ese timer expire, se compara `playerReactionMs` con `_botReactionMs` para determinar el ganador. Esto asegura que el resultado es determinista una vez decidido el retardo.

#### Justificación de `providedIn: 'root'`

`BotGameService` debe ser root por coherencia con `BotSessionService` (comparten ciclo de vida) y porque `GamePage` lo inyecta sin necesidad de providers por ruta. Si se instanciase por componente, cada navegación crearía una instancia nueva, lo cual es innecesario dado que `reset()` ya limpia el estado.

#### Testabilidad

- Todos los timers usan `setTimeout` estándar, controlable con `vi.useFakeTimers()`.
- Los handles de timer se exponen como propiedades privadas pero se cancelan via `reset()`.
- `_bangTimestamp` se puede mockear sobreescribiendo `Date.now` con `vi.spyOn(Date, 'now')`.
- El cálculo de `botReactionMs` usa `Math.random()`, mockeable con `vi.spyOn(Math, 'random')` para tests deterministas.

---

### 2.4 `MatchmakingTimeoutService`

**Fichero**: `projects/bang-game/src/app/core/services/matchmaking-timeout.service.ts`  
**providedIn**: `'root'`

```typescript
@Injectable({ providedIn: 'root' })
export class MatchmakingTimeoutService {
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
  readonly expired = signal(false);

  start(durationMs: number = 30_000): void {
    this.cancel();
    this.expired.set(false);
    this._timeoutId = setTimeout(() => {
      this.expired.set(true);
    }, durationMs);
  }

  cancel(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this.expired.set(false);
  }
}
```

**Decisión**: se usa `setTimeout` + signal en lugar de `timer()` de RxJS. Motivo: el resto del proyecto usa signals, no Observables, para estado reactivo. Mantener consistencia. El signal `expired` es consumible directamente desde el template del lobby.

---

### 2.5 `BotDifficultyPickerComponent`

**Fichero**: `projects/bang-game/src/app/pages/lobby/components/bot-difficulty-picker/bot-difficulty-picker.component.ts`  
**Tipo**: standalone component

```typescript
@Component({
  selector: 'app-bot-difficulty-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-2">
      @for (option of difficulties; track option.key) {
        <button
          [attr.data-difficulty]="option.key"
          (click)="selected.emit(option.key)"
          class="flex-1 py-2 rounded-xl border text-sm font-semibold transition-all
                 hover:bg-gray-700 active:scale-95"
          [class]="option.key === 'medium' ? 'border-yellow-400 text-yellow-400' : 'border-gray-600 text-gray-400'">
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class BotDifficultyPickerComponent {
  readonly selected = output<BotDifficulty>();

  readonly difficulties = [
    { key: 'easy'   as const, label: 'Fácil'   },
    { key: 'medium' as const, label: 'Medio'   },
    { key: 'hard'   as const, label: 'Difícil' },
  ];
}
```

Componente de presentación puro. No tiene lógica de negocio. Emite la dificultad seleccionada al padre.

---

## 3. Modificaciones a artefactos existentes

### 3.1 `GamePage` (`game.page.ts`)

**Cambios**:

1. **Nuevas inyecciones**:
   ```typescript
   private readonly botSession = inject(BotSessionService);
   private readonly botGame = inject(BotGameService);
   ```

2. **`ngOnInit`**: si `botSession.isBotGame()`, llamar `botGame.startGame()` y NO registrar handlers de SignalR.
   ```typescript
   ngOnInit(): void {
     if (this.botSession.isBotGame()) {
       this.botGame.startGame();
       return; // no registrar handlers SignalR
     }
     // ... handlers actuales sin cambios
   }
   ```

3. **Métodos de acción** — branching condicional:
   ```typescript
   onReady(): void {
     if (this.botSession.isBotGame()) {
       this.botGame.playerReady();
     } else {
       this.hub.sendReady();
     }
   }

   onTap(): void {
     if (this.botSession.isBotGame()) {
       this.botGame.playerTapped();
     } else {
       this.gameState.consumeTap();
       this.hub.sendTap();
     }
   }

   onRepeat(): void {
     if (this.botSession.isBotGame()) {
       this.gameState.waitingRematch();
       this.botGame.rematch();
     } else {
       this.gameState.waitingRematch();
       this.hub.repeat();
     }
   }

   onPlayOther(): void {
     if (this.botSession.isBotGame()) {
       this.botGame.abandon();
       this.router.navigate(['/lobby']);
     } else {
       this.gameState.reset();
       this.hub.leaveRoom();
       this.router.navigate(['/lobby']);
     }
   }
   ```

4. **`ngOnDestroy`** (nuevo — implementar `OnDestroy`):
   ```typescript
   ngOnDestroy(): void {
     if (this.botSession.isBotGame()) {
       this.botGame.reset();
       this.botSession.endBotSession();
     }
   }
   ```

5. **Template**: el header muestra `opponentUsername` que ya viene de `GameStateService.room()`. `BotGameService.startGame()` setea `room` con `opponentUsername` = nombre del bot. No hay cambios en el template.

---

### 3.2 `LobbyPage` (`lobby.page.ts`)

**Cambios**:

1. **Nuevas inyecciones**:
   ```typescript
   private readonly botSession = inject(BotSessionService);
   private readonly matchmakingTimeout = inject(MatchmakingTimeoutService);
   ```

2. **Importar componente**:
   ```typescript
   imports: [BotDifficultyPickerComponent],
   ```

3. **Nuevo bloque en template** — sección "Jugar contra bot":
   ```html
   <!-- Jugar contra bot -->
   <div class="bg-gray-800 rounded-2xl p-5 space-y-3">
     <h2 class="text-white font-bold">Jugar contra bot</h2>
     <p class="text-gray-400 text-sm">Practica contra la máquina.</p>
     <app-bot-difficulty-picker (selected)="startBotGame($event)" />
   </div>
   ```

4. **Nuevo método `startBotGame()`**:
   ```typescript
   startBotGame(difficulty: BotDifficulty): void {
     this.matchmakingTimeout.cancel();
     this.botSession.startBotSession(difficulty);
     this.router.navigate(['/game']);
   }
   ```

5. **Integración de timeout en matchmaking aleatorio**:
   ```typescript
   async joinRandom(): Promise<void> {
     this.searching.set(true);
     this.matchmakingTimeout.start(30_000);
     await this.hub.joinRandom();
   }
   ```

6. **Template condicional**: cuando `matchmakingTimeout.expired()` es true, mostrar oferta de bot:
   ```html
   @if (matchmakingTimeout.expired()) {
     <div class="text-center space-y-2">
       <p class="text-gray-400 text-sm">No hemos encontrado rival. ¿Quieres jugar contra un bot?</p>
       <app-bot-difficulty-picker (selected)="startBotGame($event)" />
     </div>
   }
   ```

7. **En `ngOnInit`**: cancelar timeout si llega humano:
   ```typescript
   this.hub.on<RoomInfo>('OpponentJoined', (room) => {
     this.matchmakingTimeout.cancel(); // ← nuevo
     this.gameState.opponentJoined(room);
     this.router.navigate(['/game']);
   });
   ```

8. **En `ngOnInit`**: limpiar estado de bot si el usuario vuelve del juego:
   ```typescript
   this.botSession.endBotSession(); // ← asegura limpieza
   ```

---

### 3.3 `game-state.model.ts`

**Sin cambios**. `GamePhase` se mantiene intacto. `BotDifficulty` va en su propio fichero `bot.model.ts`.

---

### 3.4 `GameStateService`

**Sin cambios funcionales**. `BotGameService` llama a los métodos públicos existentes (`opponentJoined`, `bothReady`, `countdownStart`, `waitingBang`, `bang`, `roundResult`, `opponentWantsRematch`, `reset`). No se necesita añadir `isBotGame` a `GameStateService` porque esa responsabilidad la tiene `BotSessionService`.

**Decisión**: no propagar `isBotGame` a `GameStateService`. Motivo: `GameStateService` es agnóstico al origen de los eventos (bot o servidor). Los componentes hijos que necesiten saber si es bot inyectan `BotSessionService` directamente. Esto evita acoplar el servicio de estado de juego al concepto de bot.

---

## 4. Flujo de timers en tests

### Patrón general

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

### `BotGameService` — timers a controlar

| Timer | Propósito | Avance en test |
|-------|-----------|----------------|
| Ready delay (300-800ms) | Simula que el bot "acepta" ready | `vi.advanceTimersByTime(800)` |
| BothReady → CountdownStart (1000ms) | Pausa antes de cuenta atrás | `vi.advanceTimersByTime(1000)` |
| Countdown → WaitingBang (2500ms) | Duración de los 2 pasos + margen | `vi.advanceTimersByTime(2500)` |
| WaitingBang → Bang (1500-4000ms) | Tensión aleatoria | Mock `Math.random()` → `vi.advanceTimersByTime(calculado)` |
| Bot tap (150-1200ms según dificultad) | Reacción del bot | Mock `Math.random()` → `vi.advanceTimersByTime(calculado)` |

### Estrategia de determinismo

Para tests deterministas, mockear `Math.random()` con un valor fijo:

```typescript
vi.spyOn(Math, 'random').mockReturnValue(0.5);
// easy:   600 + 0.5 * (1200 - 600) = 900ms
// medium: 300 + 0.5 * (600 - 300)  = 450ms
// hard:   150 + 0.5 * (300 - 150)  = 225ms
```

Para `Date.now()` (medición de reacción del jugador):

```typescript
vi.spyOn(Date, 'now')
  .mockReturnValueOnce(1000)  // bangTimestamp
  .mockReturnValueOnce(1200); // playerTapped → 200ms de reacción
```

### `MatchmakingTimeoutService` — timer a controlar

```typescript
service.start(30_000);
expect(service.expired()).toBe(false);
vi.advanceTimersByTime(30_000);
expect(service.expired()).toBe(true);
```

---

## 5. Decisiones de diseño

### D1: `BotGameService` es `providedIn: 'root'`, no instanciado por componente

**Decisión**: root.  
**Justificación**: comparte ciclo de vida con `BotSessionService` (ambos sobreviven entre navegaciones). El método `reset()` se encarga de limpiar estado entre partidas. Instanciarlo por componente no aporta nada porque el servicio ya tiene limpieza explícita, y complicaría la inyección desde `GamePage`.

### D2: Reset entre partidas bot

**Flujo**:
1. Al terminar una partida y el jugador elige "Jugar con otro": `GamePage.onPlayOther()` → `botGame.abandon()` → `reset()` + `gameState.reset()` + `botSession.endBotSession()` + navegar a lobby.
2. Al elegir revancha: `GamePage.onRepeat()` → `botGame.rematch()` → limpia timers internos + re-invoca `startGame()` (sin tocar `botSession`).
3. `GamePage.ngOnDestroy()` es la red de seguridad: si el usuario navega atrás con el botón del navegador, se ejecuta `reset()` + `endBotSession()`.
4. `LobbyPage.ngOnInit()` llama `botSession.endBotSession()` como segunda red de seguridad.

### D3: Los nombres del bot varían según dificultad

**Decisión**: sí.  
**Valores**: "Disparo Fácil" (easy), "Pistolero" (medium), "El Rápido" (hard).  
**Justificación**: aporta personalidad sin coste de implementación. Se definen en `BOT_DIFFICULTY_CONFIGS` y se propagan via `BotSessionService.opponentName` → `GameStateService.room().opponentUsername`.

### D4: `GameStateService` NO recibe `isBotGame`

**Decisión**: `GameStateService` permanece agnóstico al modo de juego.  
**Justificación**: es más limpio que el servicio de estado de juego no conozca el concepto de bot. Los componentes que necesiten distinguir modo bot inyectan `BotSessionService` directamente. Esto mantiene la separación de responsabilidades.

### D5: Signal `expired` en lugar de Observable para el timeout

**Decisión**: `MatchmakingTimeoutService.expired` es un `signal<boolean>`, no un `Observable`.  
**Justificación**: consistencia con el resto del proyecto que usa signals exclusivamente para estado reactivo. Evita mezclar paradigmas (signal + Observable) en el mismo flujo de UI.

### D6: `BotGameService` precalcula `botReactionMs` al emitir BANG

**Decisión**: el tiempo de reacción del bot se calcula en el momento del BANG, no cuando el jugador toca.  
**Justificación**: simula un oponente real que ya tiene un tiempo de reacción decidido. Si el jugador toca antes de que el timer del bot expire, la comparación es justa. Si el jugador no toca, el timer del bot expira y el bot gana. Esto evita que el resultado cambie retroactivamente.

---

## 6. Ficheros nuevos (resumen)

| Fichero | Tipo |
|---------|------|
| `projects/bang-game/src/app/core/models/bot.model.ts` | Model/Type |
| `projects/bang-game/src/app/core/services/bot-session.service.ts` | Injectable (root) |
| `projects/bang-game/src/app/core/services/bot-session.service.spec.ts` | Test |
| `projects/bang-game/src/app/core/services/bot-game.service.ts` | Injectable (root) |
| `projects/bang-game/src/app/core/services/bot-game.service.spec.ts` | Test |
| `projects/bang-game/src/app/core/services/matchmaking-timeout.service.ts` | Injectable (root) |
| `projects/bang-game/src/app/core/services/matchmaking-timeout.service.spec.ts` | Test |
| `projects/bang-game/src/app/pages/lobby/components/bot-difficulty-picker/bot-difficulty-picker.component.ts` | Standalone Component |
| `projects/bang-game/src/app/pages/lobby/components/bot-difficulty-picker/bot-difficulty-picker.component.spec.ts` | Test |

## 7. Ficheros modificados (resumen)

| Fichero | Cambio |
|---------|--------|
| `projects/bang-game/src/app/pages/game/game.page.ts` | Branching bot/humano en ngOnInit + 4 métodos de acción + ngOnDestroy |
| `projects/bang-game/src/app/pages/game/game.page.spec.ts` | Tests para modo bot |
| `projects/bang-game/src/app/pages/lobby/lobby.page.ts` | Sección bot + timeout matchmaking + imports |
| `projects/bang-game/src/app/pages/lobby/lobby.page.spec.ts` | Tests para bot + timeout |

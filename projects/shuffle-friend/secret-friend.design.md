# Design: `secret-friend`

> Estado: **COMPLETADO**

## Decisiones de arquitectura

| # | Decisión | Alternativas rechazadas |
|---|----------|------------------------|
| AD-1 | GameService con signals (root) | NgRx (overhead innecesario), component-local (prop-drilling entre 3 rutas) |
| AD-2 | Fisher-Yates retry MAX_ATTEMPTS=100 | Backtracking solver (complejidad innecesaria para grupos ≤30) |
| AD-3 | Assignments en memoria únicamente | localStorage (viola privacidad), encrypted localStorage (sobrecomplejo) |
| AD-4 | Lazy-loaded routes con functional guards | Single page con renderizado condicional |
| AD-5 | StorageService abstraction | localStorage directo en GameService (no testeable) |

## Modelos

```ts
Participant { id: string, name: string }
Exclusion { participantIdA: string, participantIdB: string }
Assignment { giverId: string, receiverId: string, revealed: boolean }
GamePhase = 'setup' | 'shuffled'
```

## GameService API

```ts
// Signals
participants: WritableSignal<Participant[]>   // hydrated from storage
exclusions:   WritableSignal<Exclusion[]>     // hydrated from storage
assignments:  WritableSignal<Assignment[]>    // in-memory only
phase:        WritableSignal<GamePhase>

// Computed
canShuffle: Signal<boolean>       // participants.length >= 3
allRevealed: Signal<boolean>      // all assignments revealed
unrevealed: Signal<Participant[]> // participants not yet revealed

// Methods
addParticipant(name: string): void
removeParticipant(id: string): void
addExclusion(idA: string, idB: string): void
removeExclusion(idA: string, idB: string): void
shuffle(): 'ok' | 'infeasible'
revealFor(participantId: string): void
reset(): void
```

## StorageService API

```ts
get<T>(key: string): T | null
set<T>(key: string, value: T): void
remove(key: string): void
// prefix: 'shuffle-friend:'
```

## Algoritmo de sorteo

```
function shuffleAssignments(participants, exclusions):
  Build exclusion Map<id, Set<id>> (symmetric + self)
  for attempt = 0 to MAX_ATTEMPTS (100):
    Fisher-Yates shuffle receivers[]
    if all assignments pass exclusion check → return assignments
  return null
```

## Timer de reveal

`setInterval` en `RevealPage` (sin RxJS). Signal `timerSeconds` alimenta `CountdownTimerComponent`. Signal `revealing` controla visibilidad de `RevealCardComponent`. `DestroyRef.onDestroy` limpia el intervalo.

## Route guards

```ts
canActivateShuffle: participants().length >= 3 ? true : createUrlTree(['/setup'])
canActivateReveal:  assignments().length > 0   ? true : createUrlTree(['/setup'])
```

## Estructura de ficheros

```
projects/shuffle-friend/src/app/
├── models/           participant, exclusion, assignment, game-phase
├── services/         game.service, storage.service
├── utils/            shuffle-assignments
├── guards/           shuffle.guard, reveal.guard
├── pages/            setup/, shuffle/, reveal/
└── components/       participant-list/, exclusion-list/, reveal-card/,
                      countdown-timer/, confirm-dialog/
```

## APIs de componentes

| Componente | Inputs | Outputs |
|-----------|--------|---------|
| ParticipantListComponent | `participants` | `add(name)`, `remove(id)` |
| ExclusionListComponent | `participants`, `exclusions` | `addExclusion({idA,idB})`, `removeExclusion({idA,idB})` |
| RevealCardComponent | `giverName`, `receiverName`, `isRevealed` | `dismiss` |
| CountdownTimerComponent | `duration` | `timerEnd` |
| ConfirmDialogComponent | `open`, `title`, `message` | `confirm`, `cancel` |

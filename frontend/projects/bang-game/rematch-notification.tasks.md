# Tasks: rematch-notification

## Fase 1 — GameStateService

- [x] 1.1 Añadir `opponentWantsRepeat = signal(false)` en `GameStateService`
- [x] 1.2 Añadir método `opponentWantsRematch(): void` que pone el signal a `true`
- [x] 1.3 Resetear `opponentWantsRepeat` a `false` en `waitingRematch()` y en `reset()`
- [x] 1.4 Tests: `opponentWantsRematch()` activa el signal; `waitingRematch()` lo resetea; `reset()` lo resetea

## Fase 2 — ResultComponent

- [x] 2.1 Añadir input `opponentWantsRepeat = input.required<boolean>()` a `ResultComponent`
- [x] 2.2 Mostrar banner "Tu oponente quiere repetir" cuando `opponentWantsRepeat()` es `true`
- [x] 2.3 Añadir atributo `data-opponent-wants-repeat` al banner para que sea testeable
- [x] 2.4 Tests: banner visible cuando input es `true`; oculto cuando es `false`

## Fase 3 — GamePage

- [x] 3.1 Registrar listener `OpponentWantsRematch` en `ngOnInit` → `gameState.opponentWantsRematch()`
- [x] 3.2 Pasar `[opponentWantsRepeat]="gameState.opponentWantsRepeat()"` a `<app-result>`

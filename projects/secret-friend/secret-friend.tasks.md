# Tasks: `secret-friend`

> Estado: **COMPLETADO** — 98/98 tests ✅

## Phase 0 — Setup (no tests)

- [x] T-00.1 Models barrel (Participant, Exclusion, Assignment, GamePhase)
- [x] T-00.2 App shell: routes skeleton (lazy routes + redirects)
- [x] T-00.3 App shell: app.ts / app.html / update app.spec.ts

## Phase 1 — Pure function shuffleAssignments (TDD)

- [x] T-01.1 RED: shuffle-assignments.spec.ts (SF-27..31)
- [x] T-01.2 GREEN: shuffle-assignments.ts (Fisher-Yates retry, MAX_ATTEMPTS=100)
- [x] T-01.3 TRIANGULATE: edge cases (empty, single, two, large, duplicate exclusions)

## Phase 2 — StorageService (TDD)

- [x] T-02.1 RED: storage.service.spec.ts (get/set/remove, prefix, corrupt JSON)
- [x] T-02.2 GREEN: storage.service.ts
- [x] T-02.3 TRIANGULATE: null, falsy values, overwrite

## Phase 3 — GameService (TDD)

- [x] T-03.1 RED: participants CRUD signals (SF-01..07)
- [x] T-03.2 GREEN: participants CRUD
- [x] T-03.3 RED: exclusions CRUD signals (SF-08..12)
- [x] T-03.4 GREEN: exclusions CRUD
- [x] T-03.5 RED: shuffle trigger (SF-13..16 partial)
- [x] T-03.6 GREEN: shuffle trigger
- [x] T-03.7 RED: reveal flow signals (SF-18, SF-25..26)
- [x] T-03.8 GREEN: reveal flow
- [x] T-03.9 RED: localStorage integration (SF-32..36)
- [x] T-03.10 GREEN: localStorage integration
- [x] T-03.11 TRIANGULATE: edge cases

## Phase 4 — Guards (TDD)

- [x] T-04.1 RED: canActivateShuffle.spec.ts (SF-37..38)
- [x] T-04.2 GREEN: canActivateShuffle guard
- [x] T-04.3 RED: canActivateReveal.spec.ts (SF-39..40)
- [x] T-04.4 GREEN: canActivateReveal guard
- [x] T-04.5 Wire guards into app.routes.ts
- [x] T-04.6 TRIANGULATE: edge cases

## Phase 5 — UI Components (TDD)

- [x] T-05.1 ParticipantListComponent (RED→GREEN→TRIANGULATE, SF-01..07 UI)
- [x] T-05.2 ExclusionListComponent (RED→GREEN→TRIANGULATE, SF-08..12 UI)
- [x] T-05.3 CountdownTimerComponent (RED→GREEN→TRIANGULATE, SF-19..22)
- [x] T-05.4 RevealCardComponent (RED→GREEN→TRIANGULATE, SF-18, SF-23..24)
- [x] T-05.5 ConfirmDialogComponent (RED→GREEN→TRIANGULATE)

## Phase 6 — Pages (TDD)

- [x] T-06.1 SetupPage (RED→GREEN→TRIANGULATE, SF-01..14)
- [x] T-06.2 ShufflePage (RED→GREEN→TRIANGULATE, SF-15..17, SF-25..26)
- [x] T-06.3 RevealPage (RED→GREEN→TRIANGULATE, SF-18..24, SF-39..40)

## Phase 7 — Integration & manifest

- [x] T-07.1 Update manifest.webmanifest (name: "Secret Friend")
- [x] T-07.2 Update index.html title
- [x] T-07.3 Full test suite green — 98/98 ✅
- [x] T-07.4 Estilos Tailwind añadidos a todas las plantillas

## Notas de implementación

- `output()` Angular 21 en tests: usar `vi.spyOn(component.output, 'emit')`, no `.subscribe()`
- `effect()` en GameService: `TestBed.flushEffects()` obligatorio para persistencia en tests
- Bug corregido: `RevealCardComponent.reveal()` no debe emitir `dismiss` — solo `close()` lo hace

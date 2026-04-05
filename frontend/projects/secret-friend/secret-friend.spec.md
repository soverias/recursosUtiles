# Spec: `secret-friend` — secret-friend

> Change ID: `secret-friend` | App: `secret-friend` | Stack: Angular 21.2 · standalone · OnPush · signals · Tailwind CSS v4 · Vitest
> Estado: **COMPLETADO** — 98/98 tests ✅

---

## Data model

```ts
interface Participant { id: string; name: string; }
interface Exclusion  { participantIdA: string; participantIdB: string; }
interface Assignment { giverId: string; receiverId: string; revealed: boolean; }
type GamePhase = 'setup' | 'shuffled';
```

---

## Arquitectura

| Capa | Pieza | Responsabilidad |
|------|-------|----------------|
| Service | `GameService` (root) | signals: participants, exclusions, assignments, phase |
| Service | `StorageService` | wrapper de lectura/escritura sobre localStorage |
| Pure fn | `shuffleAssignments(participants, exclusions)` | derangement + exclusiones → `Assignment[] \| null` |
| Route | `/setup` (default) | añadir/quitar participantes, gestionar exclusiones |
| Route | `/shuffle` | resumen + disparar sorteo |
| Route | `/reveal` | flujo tap-para-revelar |

**Guards**
- `/shuffle`: requiere `participants.length >= 3`
- `/reveal`: requiere `assignments.length > 0`
- Ambos guards redirigen a `/setup` si la condición no se cumple

**Persistencia**
- participants + exclusions → localStorage (rehidratados en init)
- assignments → solo en memoria (privacidad)

---

## REQ-1 Setup — Participantes

- SF-01 Añadir participante válido
- SF-02 Rechazar nombre vacío
- SF-03 Rechazar nombre duplicado (case-insensitive)
- SF-04 Eliminar participante
- SF-05 canShuffle false con <3 participantes
- SF-06 canShuffle true con exactamente 3
- SF-07 Eliminar participante elimina sus exclusiones

## REQ-2 Setup — Exclusiones

- SF-08 Añadir exclusión válida
- SF-09 Rechazar auto-exclusión
- SF-10 Rechazar par duplicado
- SF-11 Eliminar exclusión
- SF-12 Advertencia de exclusiones inviables

## REQ-3 Shuffle

- SF-13 Happy path del sorteo
- SF-14 El sorteo respeta exclusiones
- SF-15 Sorteo inviable muestra error
- SF-16 Navegar a /reveal en éxito
- SF-17 Guard de /shuffle redirige con <3 participantes

## REQ-4 Reveal

- SF-18 Lista de no revelados muestra solo pendientes
- SF-19 Pulsar nombre abre confirm dialog
- SF-20 Cancelar confirm dialog no hace nada
- SF-21 Confirmar abre tarjeta de reveal
- SF-22 RevealCard se oculta sola tras 5s (countdown timer)
- SF-23 Ocultar manualmente antes del timeout
- SF-24 CountdownTimerComponent decrementa correctamente
- SF-25 Pantalla done cuando todo revelado
- SF-26 Reset desde pantalla done

## REQ-5 Algoritmo

- SF-27 Sin auto-asignación (derangement)
- SF-28 Exclusión respetada
- SF-29 Biyección completa
- SF-30 Retorna null para configuración imposible
- SF-31 Retorna null cuando todas las ranuras no-self excluidas

## REQ-6 Persistencia

- SF-32 Participantes sobreviven recarga
- SF-33 Exclusiones sobreviven recarga
- SF-34 Asignaciones NO se persisten
- SF-35 localStorage vacío produce estado vacío
- SF-36 Cambios se escriben a localStorage inmediatamente

## REQ-7 Guards

- SF-37 Guard /shuffle pasa con >=3 participantes
- SF-38 Guard /shuffle bloquea con <3
- SF-39 Guard /reveal pasa con asignaciones
- SF-40 Guard /reveal bloquea sin asignaciones

---
status: implemented
last_change: reminders-system
last_verified: 2026-05-17
---

# Spec: habit-tracker

PWA cliente-only para seguir hábitos diarios y construir rachas. Sin backend, sin sync — los datos íntimos del usuario nunca salen del dispositivo.

## Visión

Caso 100% móvil: abres la app al levantarte o acostarte, marcas los hábitos que cumpliste hoy, ves la racha crecer. Psicología de refuerzo positivo estilo Duolingo aplicada a hábitos personales. La gran satisfacción visual son las **rachas** (cuántos días seguidos) y el **heatmap** de los últimos 30 días.

## Stack

Angular 21.2 standalone + signals + Tailwind CSS v4 + IndexedDB (vanilla, sin librerías). Segundo consumidor del patrón "store IDB" iniciado en `counter` — usa `HabitStore` análogo. Si el patrón se repite limpiamente, justifica extraerlo a `@shared` en una iteración futura.

## Modelo de datos

```typescript
interface Habit {
  id: string;          // crypto.randomUUID
  name: string;        // máx 40 chars
  emoji: string;       // opcional, máx 4 chars (1 grafema visual)
  marks: string[];     // array sorted de fechas YYYY-MM-DD
  createdAt: number;
}
```

Persistencia: un único object store `habits` con `keyPath: id`. Cada toggle (marcar/desmarcar día) implica leer el hábito, mutar `marks`, escribirlo entero. Tradeoff aceptado: simplicidad de schema > write granular. Para 5 hábitos × 5 años = ~1.8 MB de marks total — bien por debajo de cualquier límite IDB.

## Comportamiento

### Requirement: Lista de hábitos

El usuario MUST ver todos sus hábitos como tarjetas verticales scrolleables. Cada tarjeta independiente.

#### Scenario: Sin hábitos
- GIVEN un usuario que abre la app por primera vez
- WHEN se renderiza la pantalla
- THEN MUST mostrar empty state con CTA "Crear primer hábito" en lugar de lista vacía

#### Scenario: Hábitos existentes
- GIVEN la IndexedDB tiene N hábitos
- WHEN se abre la app
- THEN MUST renderizar los N hábitos en orden de creación (más antiguo primero)

### Requirement: Marcar hoy

Cada tarjeta MUST exponer un botón grande "Marcar hoy" (o "Hecho ✓" si ya está marcado). Toggleable — re-pulsar desmarca.

#### Scenario: Marcar incrementa racha
- GIVEN un hábito con marks: [ayer, antesdeayer]
- WHEN el usuario marca hoy
- THEN la racha pasa de 2 a 3
- AND la celda del heatmap de hoy se rellena

#### Scenario: Desmarcar reduce racha
- GIVEN un hábito con marks: [hoy, ayer, antesdeayer]
- WHEN el usuario desmarca hoy
- THEN la racha pasa de 3 a 2 (la de ayer)
- AND la celda del heatmap de hoy se vacía

### Requirement: Cálculo de racha

La racha MUST definirse como el número de días consecutivos marcados terminando en hoy O en ayer (si hoy aún no se ha marcado).

#### Scenario: Hoy no marcado, racha viva
- GIVEN un hábito con marks: [ayer, antesdeayer, hace3días]
- WHEN se calcula la racha (hoy aún sin marcar)
- THEN la racha es 3 (ayer, antesdeayer, hace3días son consecutivos)

#### Scenario: Gap rompe la racha
- GIVEN un hábito con marks: [hoy, hace3días, hace4días]
- WHEN se calcula la racha
- THEN la racha es 1 (solo hoy; la racha de hace3 días está aislada)

#### Scenario: Hábito sin marcar nunca
- GIVEN un hábito recién creado, sin marks
- WHEN se calcula la racha
- THEN la racha es 0

### Requirement: Heatmap de últimos 30 días

Cada tarjeta MUST mostrar una matriz 5×6 con las celdas de los últimos 30 días. La celda más reciente (hoy) MUST estar arriba-derecha; la más antigua (hace 29 días) abajo-izquierda. Cada celda con dos estados visuales: marcada (sólida, color de marca) o sin marcar (outline tenue).

### Requirement: Crear hábito

El usuario MUST poder añadir un hábito nuevo con:
- Nombre (string, requerido, máx 40 chars)
- Emoji opcional (de un picker preset de 12 emojis comunes, default 🔥)

#### Scenario: Validación de nombre
- GIVEN el usuario intentando crear un hábito sin nombre
- WHEN pulsa "Crear"
- THEN MUST mostrarse error inline y NO crearse el hábito

### Requirement: Editar hábito

El usuario MUST poder:
- Renombrar inline (tap en el nombre → input → Enter/blur commit)
- Cambiar emoji (tap en el emoji → picker)
- Eliminar (vía menú `⋮`, con confirmación)

### Requirement: Persistencia

Toda mutación (crear, marcar, desmarcar, renombrar, cambiar emoji, eliminar) MUST persistirse en IndexedDB antes de la siguiente acción. UI optimista — signal se actualiza primero, persist va en background.

### Requirement: Vibración háptica

Marcar hoy MUST disparar vibración corta (~30 ms). Acciones destructivas (eliminar) usan patrón largo (~60 ms).

### Requirement: PWA instalable

MUST tener manifest + service worker + iconos. Tras la primera carga funciona 100% offline. Datos siempre en IndexedDB local.

### Requirement: Recordatorios push (opcional, requiere cuenta)

El usuario MUST poder configurar un recordatorio diario por hábito a una hora local concreta. Implementado vía:
- Backend `Reminders` module + Web Push protocol con VAPID
- Custom Service Worker (`sw-custom.js` que extiende `ngsw-worker.js`) que consulta IndexedDB local al recibir push
- Cuenta de usuario obligatoria (via `@shared/auth`)
- Login flow inline en sheet/overlay `AuthSheetComponent`

Ver contrato cross-cutting completo en `../../../specs/reminders-system.spec.md`.

#### Scenario: Reminder con hábito ya marcado
- GIVEN un hábito ya marcado como hecho hoy
- WHEN el servidor envía la push del recordatorio
- THEN el Service Worker MUST descartar silenciosamente sin mostrar notificación

#### Scenario: Reminder con hábito pendiente
- GIVEN un hábito sin marcar hoy
- WHEN el servidor envía la push
- THEN el Service Worker MUST mostrar notificación con `<emoji> <name> — ¿Hecho hoy?`

#### Scenario: Cambio de timezone (viaje)
- GIVEN el usuario abre la app desde una timezone distinta a la guardada
- WHEN se inicia el componente
- THEN MUST hacerse PUT silencioso a `/api/reminders` actualizando la timezone para todos los reminders del user

## UX en móvil

- Header compacto arriba con título y botón "+" (añadir hábito).
- Lista de tarjetas verticalmente apiladas. Cada tarjeta:
  - Top: emoji + nombre (tap rename) + menú `⋮`
  - Mid-row: racha enorme a la izquierda (display serif Fraunces) + heatmap 5×6 a la derecha
  - Bottom: botón grande "Marcar hoy" / "Hecho ✓ hoy"
- Add form inline desplegable con name + emoji picker.
- Tipografía: **Fraunces** (display, números de racha) + **Outfit** (body, labels).

## Tema visual

Ceremonial / trophy-room:
- Fondo: marrón profundo `#1a0511` con vignette rose sutil
- Tarjetas: superficie `#2a0a1a` con borde rose desaturado `#5a1e3a`
- Streak number: gradient rose→coral, sombra dramática, tipografía serif Fraunces 700+
- Heatmap cells: marcadas en rose `#f43f5e`, sin marcar en outline `#5a1e3a` 1px
- Acento: rose `#f43f5e`; secundario: coral `#fb7185`

## Tests

Tests mínimos:
- `streak()` con marks vacíos → 0
- `streak()` con marks: [hoy] → 1
- `streak()` con marks: [hoy, ayer] → 2
- `streak()` con marks: [ayer, antesdeayer] (hoy sin marcar) → 2
- `streak()` con marks: [hoy, hace3días] (gap) → 1
- `HabitStore.put()` + `list()` recupera el hábito
- `HabitStore.put()` con mismo id actualiza (no duplica)

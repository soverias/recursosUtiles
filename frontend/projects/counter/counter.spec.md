---
status: spec-only
last_change: counter
last_verified: 2026-05-17
pending: |
  - Implementación pendiente
---

# Spec: counter

PWA cliente-only para contar cosas en el mundo físico (asistencias, ejercicios, inventario). Sin backend.

## Visión

Caso de uso 100% móvil: sacas el móvil, pulsas un botón grande para sumar, ves el número crecer. Sustituye al "voy contando en la cabeza y se me olvida" y a los contadores manuales mecánicos. Soporta múltiples contadores nombrados simultáneamente (asistentes + ausentes; serie A + serie B; etc.).

## Stack

Angular 21.2 standalone + Tailwind CSS v4 + IndexedDB para persistencia. Sin dependencias externas. Estrena el patrón "persistencia con IndexedDB" en el monorepo — reutilizable más adelante para habit-tracker, scratchpad, etc.

## Comportamiento

### Requirement: Lista de contadores

El usuario MUST ver todos sus contadores como tarjetas verticalmente apiladas en pantalla, scrolleable. Cada contador es independiente.

#### Scenario: Sin contadores
- GIVEN un usuario que abre la app por primera vez (IndexedDB vacía)
- WHEN se renderiza la pantalla
- THEN MUST mostrar un empty state con CTA "Crear primer contador" en lugar de lista vacía

#### Scenario: Contadores existentes
- GIVEN la IndexedDB tiene N contadores
- WHEN se abre la app
- THEN MUST renderizar los N contadores en orden de creación (más antiguo primero)

### Requirement: Operaciones sobre contador

Cada contador MUST exponer:
- **Sumar**: botón grande `+` que incrementa el valor en `step`
- **Restar**: botón grande `−` que decrementa el valor en `step` (puede ir a negativo)
- **Reset**: opción para volver el valor a 0 (accesible vía menú, no por botón directo para evitar resets accidentales)
- **Eliminar**: opción para borrar el contador (con confirmación)
- **Editar nombre**: tap en el nombre permite editarlo inline
- **Editar step**: tap en el indicador de step permite cambiarlo (default 1, valores típicos 1/5/10, configurable libre)

### Requirement: Persistencia

Todos los contadores MUST persistirse en IndexedDB. Cualquier mutación (crear, incrementar, decrementar, renombrar, cambiar step, reset, eliminar) MUST guardarse antes de la siguiente acción del usuario.

#### Scenario: Reabrir tras cierre
- GIVEN un usuario que ha creado contadores y modificado sus valores
- WHEN cierra la app y vuelve a abrirla (incluso días después)
- THEN MUST ver los mismos contadores con sus valores intactos

#### Scenario: Trabajo offline
- GIVEN el usuario sin red
- WHEN modifica contadores
- THEN MUST guardarse en IndexedDB local sin error

### Requirement: Crear contador

El usuario MUST poder añadir un contador nuevo con:
- Nombre (string, requerido, máx 32 chars)
- Step inicial (entero positivo, default 1)
- Valor inicial siempre 0

#### Scenario: Validación de nombre
- GIVEN el usuario intentando crear un contador sin nombre
- WHEN pulsa "Crear"
- THEN MUST mostrarse error inline y NO crearse el contador

### Requirement: Vibración háptica

Cada toque de `+` o `−` MUST disparar una vibración corta (~20 ms) si el dispositivo soporta `navigator.vibrate`. Las acciones destructivas (eliminar, reset) usan un patrón más largo (~60 ms).

### Requirement: PWA instalable

MUST tener manifest + service worker + iconos. Tras la primera carga funciona 100% offline. Datos siempre en IndexedDB local — nada sale del dispositivo.

## UX en móvil

- Header compacto arriba con título y botón "+" (añadir contador).
- Lista de tarjetas verticalmente apiladas. Cada tarjeta:
  - Nombre arriba (tap para editar)
  - Valor enorme en el centro (display digital monospace, tabular-nums)
  - Fila inferior: botón `−` grande, indicador de step en el medio (tap para cambiar), botón `+` grande
  - Menú "⋮" en esquina superior derecha (reset, eliminar)
- Botón circular FAB inferior derecha NO se usa — el "+" del header es suficiente y libera espacio para scroll del pulgar.
- Tipografía: JetBrains Mono (display digital) + Outfit (labels y body).

## Tema visual

Industrial / clicker mecánico:
- Fondo: verde-negro muy oscuro `#020e0a` con vignette sutil
- Tarjetas: superficie `#0d1f1a` con bordes finos `#1f4d3e` (sensación metálica)
- Display del valor: backdrop `#040a08` con texto `#34d399` y glow sutil (efecto LCD backlit)
- Botones `+/−`: circulares, grandes (~64px), emerald `#10b981`, sensación de presión al active
- Acento: emerald `#10b981`; secundario: mint `#6ee7b7`

## Aleatoriedad / cálculo

Suma/resta directa con enteros. Sin floats, sin operaciones complejas. El valor puede ser negativo. Sin límite superior — depende de cuánto soporte JavaScript en number (Safe Integer).

## Tests

Tests mínimos en el wrapper de IndexedDB (`counter.store.ts`):
- `list()` con DB vacía devuelve array vacío
- `put()` + `list()` recupera el contador guardado
- `put()` con mismo `id` actualiza (no duplica)
- `delete()` elimina el contador
- Apertura concurrente de la DB no falla (idempotente)

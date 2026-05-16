---
status: spec-only
last_change: password-generator
last_verified: 2026-05-17
pending: |
  - Implementación pendiente
---

# Spec: password-generator

PWA cliente-only para generar contraseñas seguras. Sin backend.

## Visión

Herramienta de uso rápido para móvil: generas una contraseña al crear cuenta en cualquier sitio, la copias y la pegas. Sin distracciones, sin tracking, sin internet.

## Stack

Angular 21.2 standalone + Tailwind CSS v4 + Vitest. Signals + OnPush. Patrón idéntico a calculator y secret-friend.

## Comportamiento

### Requirement: Generación on-demand y reactiva

La contraseña MUST regenerarse automáticamente cuando cambie cualquier opción de configuración. El usuario MUST poder forzar una nueva generación manualmente con un botón "Regenerar".

#### Scenario: Cambio de longitud regenera

- GIVEN una contraseña visible en pantalla
- WHEN el usuario mueve el slider de longitud a un nuevo valor
- THEN MUST aparecer una nueva contraseña de la nueva longitud automáticamente

#### Scenario: Toggle de conjunto regenera

- GIVEN una contraseña visible con todos los conjuntos activos
- WHEN el usuario desactiva el conjunto de símbolos
- THEN MUST regenerarse una nueva contraseña que no contenga símbolos

#### Scenario: Botón regenerar manual

- GIVEN una contraseña visible
- WHEN el usuario pulsa el botón "Regenerar"
- THEN MUST generarse una nueva contraseña distinta con la configuración actual

### Requirement: Configuración de la contraseña

El sistema MUST permitir configurar:
- **Longitud**: entero entre 4 y 64 (default 16)
- **Mayúsculas** (A-Z): toggle on/off, default ON
- **Minúsculas** (a-z): toggle on/off, default ON
- **Números** (0-9): toggle on/off, default ON
- **Símbolos** (`!@#$%^&*()-_=+[]{};:,.<>?/`): toggle on/off, default ON
- **Excluir caracteres similares** (1, l, I, 0, O): toggle on/off, default OFF

Si todos los toggles están desactivados, MUST mostrar mensaje "Selecciona al menos un conjunto" en lugar de contraseña.

### Requirement: Aleatoriedad criptográfica

La generación MUST usar `crypto.getRandomValues()` (Web Crypto API, disponible en cualquier contexto incluido HTTP plano). MUST NOT usar `Math.random()`. La selección de carácter MUST ser uniforme — usar rejection sampling para evitar bias modular.

### Requirement: Copia rápida

El sistema MUST proporcionar un botón "Copiar" prominente que copie la contraseña actual al portapapeles. MUST mostrar feedback visual breve ("Copiada ✓") al copiar.

#### Scenario: Copiar contraseña

- GIVEN una contraseña generada visible
- WHEN el usuario pulsa "Copiar"
- THEN MUST copiarse al portapapeles
- AND MUST mostrar feedback "Copiada ✓" durante 2 segundos

### Requirement: Historial local

El sistema MUST mantener un historial de las últimas **10 contraseñas generadas** en `localStorage`. Cada entrada incluye contraseña + timestamp. El usuario MUST poder copiar o eliminar cualquier entrada individual, y limpiar todo el historial.

#### Scenario: Añadir al historial

- GIVEN una contraseña generada
- WHEN el usuario pulsa "Copiar"
- THEN MUST añadirse al historial automáticamente (posición 0, más reciente)

#### Scenario: Capado a 10 entradas

- GIVEN el historial con 10 entradas
- WHEN se copia una contraseña nueva
- THEN la entrada más antigua MUST eliminarse y la nueva ocupa la posición 0

#### Scenario: Eliminar entrada

- GIVEN el historial con N entradas
- WHEN el usuario pulsa la papelera de una entrada
- THEN esa entrada MUST eliminarse y el resto se mantiene

#### Scenario: Persistencia

- GIVEN el historial con entradas
- WHEN el usuario recarga la página
- THEN MUST restaurarse el historial desde `localStorage`

### Requirement: PWA instalable

MUST tener `manifest.webmanifest` + service worker + iconos. Funciona offline al 100% tras la primera carga (no hace network requests en runtime).

## UX en móvil

- Pantalla única sin scroll si es posible (modulo historial colapsable).
- Output grande, monoespaciado, fácil de leer.
- Toggles tipo switch grandes, thumb-friendly.
- Slider con valor numérico visible al lado.
- Botón "Copiar" prominente (CTA principal).
- Historial colapsable (oculto por defecto en móvil).

## Tests

Mínimo cubrir:
- `generatePassword`: longitud correcta, charset respetado, rejection sampling unbiased (test estadístico ligero).
- `buildCharset`: combinaciones de toggles, excludeSimilar elimina caracteres correctos.
- `HistoryService`: add capa a 10, remove, clear, persistencia localStorage.
- Componente: copiar invoca clipboard, feedback visible, etc. — coverage de los flujos críticos.

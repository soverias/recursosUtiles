---
status: spec-only
last_change: qr-generator
last_verified: 2026-05-17
pending: |
  - Implementación pendiente
---

# Spec: qr-generator

PWA cliente-only para generar códigos QR. Sin backend.

## Visión

Herramienta de uso rápido para móvil: pegas una URL/texto, sale el QR, otro móvil lo escanea. Sustituye al "te lo paso por WhatsApp" para compartir links/wifi/contactos en persona.

## Stack

Angular 21.2 standalone + Tailwind CSS v4 + Vitest. Generación 100% local con `@shared/util/generateQrSvg`, que envuelve la librería **vendoreada** (no `npm install`) de Project Nayuki — MIT, pinneada al commit `8329a710`, ubicada en `projects/shared/src/util/qrcodegen.ts`.

## Comportamiento

### Requirement: Generación reactiva

El QR MUST regenerarse automáticamente al cambiar el texto o el nivel ECC. Sin botón "generar".

#### Scenario: Texto cambia

- GIVEN un QR visible
- WHEN el usuario teclea más texto en el input
- THEN MUST regenerarse el QR mostrando la nueva codificación

#### Scenario: Texto vacío

- GIVEN un input sin texto
- WHEN se renderiza la pantalla
- THEN MUST mostrar placeholder "Escribe algo para generar tu QR" en lugar de QR vacío

### Requirement: Nivel de corrección de errores

El usuario MUST poder elegir entre 4 niveles ECC:
- **L** (Low) — ~7% recovery, más capacidad
- **M** (Medium, default) — ~15% recovery
- **Q** (Quartile) — ~25% recovery
- **H** (High) — ~30% recovery, menos capacidad

Cambiar el nivel MUST regenerar el QR.

### Requirement: Visualización del QR

El QR MUST renderizarse como SVG inline (no `<img>`), responsive, llenando el ancho del contenedor manteniendo proporción 1:1. Fondo blanco, módulos negros (alto contraste, mejor escaneo).

### Requirement: Descarga del QR

El usuario MUST poder descargar el QR como:
- **SVG** — vector, fichero ligero. Nombre `qr-<timestamp>.svg`.
- **PNG 1024×1024** — generado on-the-fly desde el SVG vía canvas. Nombre `qr-<timestamp>.png`.

### Requirement: Copia rápida

El usuario MUST poder copiar el **texto codificado** al portapapeles (no la imagen — es lo que querrá pegar en otro sitio). Reutiliza `@shared/util/copyToClipboard` con fallback para contextos inseguros.

### Requirement: Compartir (Web Share API)

Si `navigator.canShare` está disponible y soporta ficheros, MUST mostrarse un botón "Compartir" que comparta el PNG del QR vía el menú nativo del SO. Si no está disponible (Chrome desktop, HTTP plano sin secure context, etc.), el botón MUST ocultarse — no se muestra un botón roto.

### Requirement: Capacidad y errores

Si el texto es demasiado largo para encodear (>~2950 bytes en ECC L, menos en ECC superior), MUST mostrarse un mensaje "Texto demasiado largo para este nivel ECC" en lugar del QR. La librería lanza `RangeError`; el componente lo captura y muestra el mensaje.

### Requirement: PWA instalable

MUST tener manifest + service worker + iconos. Tras la primera carga funciona 100% offline.

## UX en móvil

- Input arriba (textarea grande, multilínea — fits URLs largas y wifi credentials).
- ECC selector: 4 pills horizontales, thumb-friendly.
- QR debajo, grande (~80% ancho), bordes redondeados sutiles.
- Acciones (descargar SVG / descargar PNG / copiar texto / compartir) en una fila o grid 2×2, botones grandes.
- Sin scroll cuando el texto es corto.

## Tests

Mínimo cubrir en el wrapper `@shared/util/qr-code.ts`:
- `generateQrSvg` con texto simple devuelve SVG válido (XML well-formed, viewBox correcto, contiene `<path>`).
- Diferentes ECC levels producen QR distintos (mismo texto, distinto output).
- Texto vacío lanza o produce QR mínimo (verificar comportamiento).
- Texto extremadamente largo lanza error capturable.

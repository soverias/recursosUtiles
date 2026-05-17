---
status: partial
last_change: random-generator
last_verified: 2026-05-17
pending: |
  - Modo "rango libre" (slot machine)
  - Modo "ruleta" (elegir de una lista)
  - Modo "bola 8 mágica" (sí/no/tal vez)
  - Iconos PWA propios (actualmente placeholder copiados de qr-generator)
---

# Spec: random-generator

PWA cliente-only para generar valores aleatorios con metáforas visuales. Sin backend.

## Visión

Herramienta de decisión rápida en móvil que sustituye al "yo qué sé, lánzalo a suertes": en vez de una UI seria con un número en pantalla, cada modo tiene su propio visual divertido (moneda 3D, dado 3D, d20 estilizado). Mobile-first, instalable como PWA.

## Stack

Angular 21.2 standalone + Tailwind CSS v4. Sin dependencias externas: animaciones con CSS 3D puro (perspective + transform-style: preserve-3d). Aleatoriedad con `Math.random()` — suficiente para un uso lúdico, no criptográfico.

## Comportamiento

### Requirement: Selector de modo

El usuario MUST poder cambiar entre 3 modos en el MVP: `coin`, `d6`, `d20`. Los modos se muestran como una fila de 3 botones grandes con icono + etiqueta. Cambiar de modo NO debe ser posible durante una tirada en curso (botones deshabilitados).

### Requirement: Tirar

Un único botón "Tirar" abajo, full-width, pulgar-friendly. Mientras `rolling === true`:
- El botón muestra "Girando…" y queda deshabilitado.
- El selector de modo queda deshabilitado.
- El visual del modo activo ejecuta su animación.

Al terminar la animación:
- Se calcula y muestra el resultado final.
- Se añade al historial (top de la lista, mantiene últimas 5).
- Vibración háptica corta (60ms) si el dispositivo lo soporta.

### Requirement: Modo moneda

- Visual: SVG circular con dos caras (Cara `€` y Cruz `★`) sobre disco metálico ámbar.
- Animación: rotación `rotateY` con 5 vueltas completas + ángulo final (0deg si cara, 180deg si cruz). Duración ~1.2s con easing `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- Resultado: 50/50.

### Requirement: Modo D6 (dado de 6 caras)

- Visual: cubo 3D CSS con las 6 caras pintadas con sus puntos clásicos (pips).
- Animación: rotación combinada `rotateX/rotateY` con 2 vueltas completas + ángulo final que muestra la cara correcta hacia cámara. Duración ~1s.
- Resultado: entero entre 1 y 6, uniforme.

### Requirement: Modo D20

- Visual: SVG hexagonal estilizado (silueta clásica de d20 en 2D) con el número grande centrado.
- Animación: shake CSS (rotación + escala) mientras gira; el número se va actualizando cada 70ms con valores aleatorios para dar sensación de "ruleta", y se fija en el valor final al terminar (~1s).
- Resultado: entero entre 1 y 20, uniforme.

### Requirement: Historial

Al menos las últimas 5 tiradas MUST mostrarse en una sección debajo del botón, etiquetadas con el modo y el resultado. El historial vive solo en memoria (no persiste entre recargas).

### Requirement: PWA instalable

MUST tener manifest + service worker + iconos. Tras la primera carga funciona 100% offline.

## UX en móvil

- Header compacto arriba.
- Selector de modo: 3 píldoras grandes con emoji + label.
- Stage central: ~220px de alto, perspectiva 3D para coin/dado.
- Botón "Tirar" abajo, prominente (`bg-amber-500`).
- Historial debajo, opcional (solo aparece si hay tiradas).
- Footer pequeño.

## Tema visual

- Color base: ámbar (`#f59e0b`).
- Fondo: marrón muy oscuro tintado de ámbar (`#1a0f02`) con dos radiales sutiles.
- Tipografía: Outfit (Google Fonts), igual que el resto de PWAs del catálogo.

## Roadmap (post-MVP)

Tres modos adicionales planificados para implementar en un segundo paso:
- **Rango libre**: slot machine — usuario define min/max, animación de rodillo.
- **Ruleta**: rueda giratoria con items definidos por el usuario.
- **Bola 8 mágica**: sí/no/tal vez con animación de niebla.

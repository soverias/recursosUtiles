---
status: implemented
last_change: icon-system
last_verified: 2026-05-17
---

# Spec: random-generator

PWA cliente-only para generar valores aleatorios con metáforas visuales. Sin backend.

## Visión

Herramienta de decisión rápida en móvil que sustituye al "yo qué sé, lánzalo a suertes": en vez de una UI seria con un número en pantalla, cada modo tiene su propio visual divertido (moneda 3D, dado 3D, d20 estilizado). Mobile-first, instalable como PWA.

## Stack

Angular 21.2 standalone + Tailwind CSS v4. Sin dependencias externas: animaciones con CSS 3D puro (perspective + transform-style: preserve-3d). Aleatoriedad con `Math.random()` — suficiente para un uso lúdico, no criptográfico.

## Comportamiento

### Requirement: Selector de modo

El usuario MUST poder cambiar entre 6 modos: `coin`, `d6`, `d20`, `slot`, `wheel`, `magic8`. Los modos se muestran en una grilla 2×3 de botones grandes con icono + etiqueta. Cambiar de modo NO debe ser posible durante una tirada en curso (botones deshabilitados).

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

### Requirement: Modo rango (slot machine)

- Visual: marco de slot machine con tantos rodillos verticales como dígitos tenga `slotMax` (1 a 5). Inputs `Mín` y `Máx` arriba (numéricos, 0-99999).
- Animación: cada rodillo es un strip vertical de 100 dígitos (0-9 × 10) que se desplaza con `translateY` y termina mostrando el dígito correcto. ~1.5s. Tras asentarse, snap invisible que resetea spins (manteniendo bounded el offset).
- Restricciones: si `Mín > Máx` se autocorrige al valor mayor; el botón "Tirar" se deshabilita si los inputs no son válidos.
- Resultado: entero uniforme entre `Mín` y `Máx`, inclusive.

### Requirement: Modo ruleta

- Visual: rueda SVG circular con slices alternando dos tonos ámbar; etiquetas de texto en cada slice (truncadas a 10 chars + "…"); indicador triangular fijo arriba.
- Lista de items: input + botón "+" para añadir; chips debajo con "×" para quitar. Mínimo 2 items para tirar, máximo 12.
- Animación: rotación con 3 vueltas completas + ajuste a la slice ganadora bajo el indicador. Duración ~3.6s, easing `cubic-bezier(0.15, 0.45, 0.1, 1)` para deceleración natural.
- Resultado: item ganador uniforme entre los items definidos. Se muestra debajo de la rueda al finalizar.

### Requirement: Modo bola 8 mágica

- Visual: esfera negra con highlight superior (radial gradient) y "8" clásico arriba. Ventana triangular central que muestra la respuesta.
- Input opcional: campo de texto decorativo para escribir la pregunta (no afecta al resultado).
- Animación: shake de la esfera ~1.5s; al terminar, la ventana triangular se ilumina con la respuesta en ámbar con glow.
- Catálogo de respuestas: 14 frases clásicas adaptadas al castellano (positivas, neutras, negativas, mixtas).
- Resultado: respuesta uniforme entre las 14 disponibles.

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

## Accesibilidad

`prefers-reduced-motion: reduce` desactiva las animaciones de shake (d20, bola 8) y el reveal del 8, y acorta las transiciones de coin/d6/slot/wheel a 0.2s. La interactividad se mantiene completa.

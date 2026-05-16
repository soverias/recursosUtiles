# Ideas para futuras herramientas

Lista viva de candidatos a entrar en el catálogo. **Criterio de selección**: client-only (sin backend) salvo justificación. Útiles, simples, uso rápido.

No son compromisos — son ideas. Cuando se vaya a implementar una, abrir su SDD propio (`sdd-new <nombre>`).

---

## Categoría: Generadores

- **password-generator** — genera passwords seguros con configuración (longitud, mayúsculas/minúsculas/números/símbolos, exclusión de caracteres ambiguos). Historial local en `localStorage`.
- **uuid-generator** — UUID v4 (y v7 cuando esté estandarizado). Botón "copiar" + lista de últimos generados.
- **qr-generator** — texto/URL → QR. Descarga PNG/SVG. Configuración de tamaño y corrección de errores.
- **lorem-ipsum** — texto placeholder con configuración de párrafos/palabras/longitud.
- **random** — dado, moneda, número aleatorio en rango, elemento aleatorio de una lista.

## Categoría: Convertidores y formato

- **json-tools** — formatear, minificar, validar JSON. Vista en árbol colapsable.
- **base64** — encoder/decoder con detección automática de entrada.
- **regex-tester** — campo de regex + campo de texto + resaltado de matches + groups + flags. Cheatsheet integrada.
- **url-tools** — parser, builder, encoder/decoder de query params.
- **timestamp** — Unix epoch ↔ fecha ISO ↔ fecha local. Conversión en tiempo real.
- **diff-viewer** — comparar dos textos lado a lado con resaltado.

## Categoría: Visual / diseño

- **color-picker** — selector + conversión HEX/RGB/HSL/OKLCH + generador de paletas + WCAG contrast checker.
- **css-units** — converter px/rem/em/% con base configurable.
- **gradient-builder** — editor visual de CSS gradients con copy-to-clipboard.

## Categoría: Productividad personal

- **timer** — Pomodoro + temporizadores configurables + notificaciones del navegador.
- **stopwatch** — cronómetro con vueltas, exportable a CSV.
- **scratchpad** — bloc de notas rápido con autosave en localStorage. Markdown opcional.
- **habit-tracker** — checklist diaria, racha visible, datos en IndexedDB.
- **counter** — contador genérico de clicks (asistencia, inventario, etc.) con etiquetas.

## Categoría: Numérica / financiera

- **tip-calculator** — propina + reparto entre N personas.
- **bmi-calculator** — IMC con interpretación y unidades múltiples.
- **interest-calculator** — interés simple/compuesto con gráfico.

## Categoría: Texto

- **text-tools** — uppercase/lowercase/title case, contar palabras/caracteres, eliminar líneas vacías, ordenar líneas, deduplicar.
- **markdown-preview** — editor + preview side-by-side, exporta a HTML.

## Categoría: Tiempo / agenda

- **world-clock** — múltiples zonas horarias en una pantalla.
- **countdown** — cuenta atrás hasta fecha objetivo (cumpleaños, deadline, etc.).

---

## Ideas que necesitarían backend

Apuntadas pero contra el principio del proyecto. Solo entrar si hay justificación fuerte:

- **currency-converter** — necesita rates en tiempo real (API externa o backend cache).
- **url-shortener** — necesita persistencia compartida.
- **paste-bin** — necesita storage compartido.
- **collaborative-anything** — multi-user requiere coordinación servidor.

Por defecto, ninguna de estas se implementa salvo que la necesidad lo justifique explícitamente.

---

## Apps multijugador

- **bang-game** ✅ ya implementado (backend requerido — multijugador en tiempo real con árbitro absoluto).
- Otras ideas multijugador (chess, tic-tac-toe, etc.) podrían reutilizar el patrón SignalR de bang-game, pero solo si aportan valor real al catálogo.

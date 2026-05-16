# Ideas para futuras herramientas

Lista viva de candidatos a entrar en el catálogo. **Criterios de selección**:
1. Client-only (sin backend) salvo justificación.
2. **Mobile-first**: la app debe valer la pena abrirla en el móvil. En PC ya existen mil alternativas online — no competimos ahí. El criterio aplicado es "¿sacarías el móvil para esto?".

No son compromisos — son ideas. Cuando se vaya a implementar una, abrir su SDD propio (`sdd-new <nombre>`).

---

## ⭐ Recomendados para el catálogo (mobile-strong)

Por orden propuesto de implementación:

1. **password-generator** — generas un password al crear cuenta desde el móvil. Uso diario.
2. **qr-generator** — compartir URL/wifi/contacto con QR físicamente presente. Caso 100% móvil.
3. **tic-tac-toe** (multijugador) — primer juego por turnos sobre la infra de bang-game; valida el patrón.
4. **counter** — pulsar para contar cosas en el mundo físico (asistencias, ejercicios, inventario).
5. **random** — cara/cruz, dado, número aleatorio, escoger persona de lista. Uso social presencial.
6. **tip-calculator** — propina + reparto entre N en restaurante.
7. **timer** — Pomodoro + temporizadores nombrados (la built-in del móvil sirve pero los nombres + presets ganan).
8. **habit-tracker** — checklist diaria, racha visible.
9. **countdown** — cuenta atrás a evento (vacaciones, deadline). Valor real cuando entremos en notificaciones.
10. **world-clock** — saber hora en otra zona antes de llamar a alguien fuera.
11. Más multijugador cuando proceda: **rock-paper-scissors**, **connect-four**, **memory-cards**, **dots-and-boxes**, **word-duel** (Wordle-style), eventualmente **chess/checkers/reversi**.

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

Reutilizan el patrón establecido por bang-game: SignalR + árbitro server-side + matchmaking + salas privadas con código. Cada uno requiere su propio hub o métodos en el hub existente, pero la infraestructura (auth, matchmaking, room-management) ya está en sitio.

**Por dificultad / valor de implementación, ordenadas de menor a mayor**:

- **tic-tac-toe** — el "Hello World" del multijugador por turnos. Estado mínimo (9 celdas), reglas triviales, partidas de 30 segundos. Buen siguiente paso para validar el patrón de "turn-based" sobre la infra existente.
- **rock-paper-scissors** — mecánica simultánea (ambos eligen, reveal a la vez), no por turnos. Cercano al ritmo de bang-game pero sin reflejo. Best-of-N opcional.
- **connect-four** — evolución natural de tic-tac-toe: tablero 7×6, mismas dinámicas de turno. Más estrategia, mismo coste de infra.
- **dots-and-boxes** — turnos con scoring acumulado. Estado interesante (líneas marcadas + cajas cerradas). Partidas un poco más largas.
- **memory-cards** — tablero de cartas boca abajo, turnos para destapar pares. Estado compartido visible para ambos.
- **typing-race** — escribir un párrafo antes que el oponente. WPM en tiempo real, progreso visible del rival. Mezcla reflejo + sostenido.
- **word-duel** — adivinar la palabra del oponente Wordle-style con tablero compartido. Strategia + vocabulario.
- **reversi/othello** — turnos, captura de fichas. Reglas más elaboradas pero estado simple (tablero 8×8).
- **checkers** — turnos, capturas múltiples, promoción. Buen escalón antes de chess.
- **chess** — el clásico. Mucho más estado (legal moves, jaque, jaque mate, enroque, en passant, promoción, reloj). Justifica spec cross-cutting propio y probablemente su propio bounded context en backend.

**Criterio de añadido al catálogo**:
- Debe poder jugarse en partidas cortas (idealmente < 5 min) salvo justificación (chess, word-duel pueden ser más largos).
- Reusar al máximo la infraestructura de bang-game (auth, matchmaking, salas privadas). Si una idea requiere algo radicalmente distinto, replantear.
- Ranking pública opcional pero recomendable (usuarios registrados solo, igual que bang-game).
- Bots locales (frontend) para jugar sin oponente — siguiendo el patrón de `bot-opponent` de bang-game.

---

## Reusables que saldrían de implementar múltiples multijugador

Cuando hagamos el segundo juego multijugador (probablemente tic-tac-toe), conviene extraer al shared:

- **MatchmakingClient** — wrapper sobre SignalR para "buscar partida aleatoria" + "crear/unirse a sala privada".
- **GameRoomState\<TPhase\>** — máquina de estados parametrizada con signal de fase.
- **GuestIdentityService** — generación de `Invitado_XXXX` ya está duplicable (lo que pasa con bang-game hoy).
- **LobbyComponent** — componente shared con UI de matchmaking + sala privada, parametrizable por juego.

Este refactor solo merece la pena con 2+ juegos. No anticipar.

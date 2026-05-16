# Spec: bot-opponent

**Change**: bot-opponent
**Project**: recursosutiles / bang-game
**Date**: 2026-04-05
**Status**: approved

---

## Descripción general

Esta feature permite a los jugadores de Bang Game disputar partidas contra un bot local cuando no hay oponente humano disponible. El bot vive íntegramente en el frontend: no realiza llamadas al backend ni reporta resultados al servidor, por lo que las partidas contra bot no afectan al ranking. Hay dos puntos de entrada: (1) timeout automático en la cola de matchmaking aleatorio, donde el sistema ofrece al jugador activar el bot tras 30 segundos de espera, y (2) botón manual "Jugar contra bot" disponible en el lobby y en salas privadas. El jugador puede elegir entre tres niveles de dificultad (fácil, medio, difícil). El bot simula todas las fases del ciclo de juego mediante timers locales, incluyendo false start propio y resultado calculado localmente.

---

## matchmaking-bot

### Requirement: Timeout automático en cola de matchmaking

Cuando el jugador lleva 30 segundos en la cola de matchmaking aleatorio sin que haya llegado un oponente humano, el sistema DEBE mostrar una oferta para jugar contra el bot. Si el jugador acepta, se cancela la búsqueda de humano y se inicia sesión bot con la dificultad seleccionada. Si llega un humano antes de que el jugador acepte la oferta, se cancela la oferta y se procede con la partida normal.

#### Scenario: Oferta de bot aparece tras 30 segundos en cola

- GIVEN el jugador está en la cola de matchmaking aleatorio
- AND han transcurrido exactamente 30 segundos sin oponente humano
- WHEN `MatchmakingTimeoutService` emite el evento de timeout
- THEN la UI MUST mostrar una oferta visible al jugador para activar el bot
- AND la oferta MUST incluir un selector de dificultad (fácil / medio / difícil)
- AND la búsqueda de humano MUST continuar activa mientras el jugador decide

#### Scenario: El jugador acepta la oferta de bot

- GIVEN la oferta de bot está visible tras el timeout
- AND el jugador ha seleccionado una dificultad
- WHEN el jugador confirma "Jugar contra bot"
- THEN la cola de matchmaking MUST ser cancelada (desconexión SignalR o leaveRoom)
- AND `BotSessionService.startBotSession(difficulty)` MUST ser llamado
- AND la UI MUST navegar a `/game` en modo bot

#### Scenario: El jugador rechaza la oferta de bot

- GIVEN la oferta de bot está visible tras el timeout
- WHEN el jugador descarta la oferta (botón "Seguir esperando" o cierra el diálogo)
- THEN la oferta MUST desaparecer
- AND la cola de matchmaking MUST continuar activa sin interrupción
- AND el contador de timeout MUST reiniciarse para no volver a ofrecer el bot inmediatamente

#### Scenario: Llega un humano antes de que el jugador acepte la oferta

- GIVEN la oferta de bot está visible (timeout ya ocurrió)
- WHEN el servidor emite el evento `OpponentJoined`
- THEN la oferta de bot MUST ser descartada automáticamente
- AND el flujo normal de partida MUST continuar (navegación a `/game` en modo humano)
- AND `BotSessionService` MUST permanecer inactivo (`isBotGame = false`)

#### Scenario: Llegada de humano justo en el mismo instante del timeout

- GIVEN el timer de 30 segundos alcanza cero
- AND simultáneamente el servidor emite `OpponentJoined`
- WHEN ambos eventos se procesan
- THEN la partida humana MUST tener prioridad
- AND el bot MUST NOT ser activado
- AND la oferta MUST NOT ser mostrada si ya llegó el humano

---

## lobby-bot

### Requirement: Botón manual "Jugar contra bot" en el lobby

El lobby DEBE ofrecer un botón "Jugar contra bot" visible en todo momento, independientemente de si el jugador está en cola o no. Al pulsarlo, el jugador selecciona la dificultad y la partida bot comienza de inmediato sin necesidad de conectarse al servidor.

#### Scenario: Botón visible en estado inicial del lobby

- GIVEN el jugador está en el lobby sin estar en ninguna cola
- WHEN se renderiza la página del lobby
- THEN el botón "Jugar contra bot" MUST ser visible
- AND el botón MUST estar habilitado

#### Scenario: Botón visible mientras el jugador está en cola de matchmaking

- GIVEN el jugador está en la cola de matchmaking aleatorio (antes del timeout)
- WHEN se renderiza el lobby
- THEN el botón "Jugar contra bot" MUST ser visible
- AND el botón MAY estar deshabilitado durante los primeros 30 segundos de cola (para forzar al jugador a esperar primero)

#### Scenario: Selector de dificultad al pulsar el botón

- GIVEN el jugador está en el lobby
- WHEN el jugador pulsa "Jugar contra bot"
- THEN `BotDifficultyPickerComponent` MUST ser mostrado
- AND MUST ofrecer tres opciones: fácil, medio, difícil
- AND ninguna dificultad MUST estar preseleccionada por defecto (el jugador elige explícitamente)

#### Scenario: Inicio de partida bot desde lobby

- GIVEN `BotDifficultyPickerComponent` está visible
- AND el jugador ha seleccionado una dificultad
- WHEN el jugador confirma la selección
- THEN si el jugador estaba en cola, la cola MUST ser cancelada antes de continuar
- AND `BotSessionService.startBotSession(difficulty)` MUST ser llamado
- AND la UI MUST navegar a `/game`
- AND NO MUST realizarse ninguna llamada al backend

#### Scenario: Cancelación del selector de dificultad

- GIVEN `BotDifficultyPickerComponent` está visible
- WHEN el jugador cierra o cancela el selector
- THEN el lobby MUST volver al estado anterior sin cambios
- AND `BotSessionService` MUST permanecer inactivo

---

## bot-game-session

### Requirement: Simulación completa del ciclo de juego contra el bot

`BotGameService` DEBE simular todas las fases del ciclo de juego de forma local, replicando exactamente la secuencia de transiciones de estado que produce el servidor en partidas humanas. `GameStateService` es el único punto de escritura de estado; `BotGameService` llama a sus métodos directamente.

#### Scenario: Fase waiting-opponent → waiting-ready (BothReady simulado)

- GIVEN `GamePage` ha cargado en modo bot (`isBotGame = true`)
- WHEN `botGameService.start()` es llamado
- THEN `GameStateService` MUST transicionar a `waiting-ready` de forma inmediata (sin espera de red)
- AND la UI MUST mostrar el estado de "listo para comenzar"

#### Scenario: El jugador pulsa "Listo" (waiting-ready → countdown)

- GIVEN el estado es `waiting-ready`
- WHEN el jugador pulsa el botón de listo y `botGameService.playerReady()` es llamado
- THEN `GameStateService` MUST transicionar a `countdown` inmediatamente
- AND el countdown MUST comenzar (3-2-1 o el valor configurado)

#### Scenario: Finalización del countdown → waiting-bang

- GIVEN el estado es `countdown`
- WHEN el countdown llega a cero
- THEN `GameStateService` MUST transicionar a `waiting-bang`
- AND el botón BANG MUST aparecer en la UI pero aún no ser activo
- AND el bot MUST iniciar internamente un timer de espera (`waitingBangDelayMs`) antes de pasar a `bang-active`

#### Scenario: Transición waiting-bang → bang-active (señal Bang simulada)

- GIVEN el estado es `waiting-bang`
- WHEN `BotGameService` emite internamente la señal Bang (tras el delay interno)
- THEN `GameStateService` MUST transicionar a `bang-active`
- AND el botón BANG MUST activarse en la UI
- AND `BotGameService` MUST registrar el instante (`bangTimestamp`) para calcular el tiempo de reacción del jugador
- AND simultáneamente `BotGameService` MUST iniciar el timer de reacción del bot (`botReactionMs`)

#### Scenario: El jugador pulsa BANG durante bang-active (jugador gana)

- GIVEN el estado es `bang-active`
- AND el bot aún no ha "pulsado" (su timer no ha expirado)
- WHEN el jugador llama `botGameService.playerTapped()`
- THEN el timer del bot MUST ser cancelado
- AND `BotGameService` MUST calcular `playerReactionMs = now - bangTimestamp`
- AND `GameStateService` MUST transicionar a `result` con `winner = 'player'`
- AND el resultado MUST mostrar el tiempo de reacción del jugador

#### Scenario: El bot pulsa BANG antes que el jugador (bot gana)

- GIVEN el estado es `bang-active`
- WHEN el timer de reacción del bot expira antes de que el jugador llame `playerTapped()`
- THEN `GameStateService` MUST transicionar a `result` con `winner = 'bot'`
- AND el resultado MUST mostrar el tiempo de reacción del bot como referencia

#### Scenario: El jugador pulsa BANG durante waiting-bang (false start del jugador)

- GIVEN el estado es `waiting-bang`
- WHEN el jugador llama `botGameService.playerTapped()` antes de la señal Bang
- THEN `BotGameService` MUST detectar el false start (`isFalseStart = true`)
- AND el timer de la señal Bang MUST ser cancelado
- AND `GameStateService` MUST transicionar a `result` con `winner = 'bot'` y `isFalseStart = true`
- AND la UI MUST mostrar el mensaje de false start del jugador

#### Scenario: El bot comete un false start

- GIVEN el estado es `waiting-bang` (antes de la señal Bang)
- WHEN `BotGameService` decide internamente que el bot comete un false start (lógica configurable por dificultad)
- THEN `GameStateService` MUST transicionar a `result` con `winner = 'player'` y `isBotFalseStart = true`
- AND la UI MUST reflejar que el bot se adelantó

#### Scenario: Revancha contra el bot

- GIVEN el estado es `result`
- WHEN el jugador llama `botGameService.rematch()`
- THEN `BotGameService` MUST reiniciar el ciclo desde `waiting-ready`
- AND la dificultad MUST mantenerse igual que en la partida anterior
- AND NO MUST realizarse ninguna llamada al backend

#### Scenario: El jugador abandona la partida bot

- GIVEN el jugador está en cualquier fase de una partida bot
- WHEN el jugador navega fuera de `/game` o llama `botGameService.abandon()`
- THEN todos los timers internos de `BotGameService` MUST ser cancelados
- AND `BotSessionService.clear()` MUST ser llamado
- AND `isBotGame` MUST volver a `false`

#### Scenario: Limpieza de estado al destruir GamePage

- GIVEN el jugador estaba en una partida bot
- WHEN `GamePage.ngOnDestroy()` es ejecutado
- THEN `BotSessionService.clear()` MUST ser llamado automáticamente
- AND no MUST quedar timers activos en `BotGameService`

---

## bot-difficulty

### Requirement: Modelo de dificultad del bot con rangos de reacción definidos

El bot DEBE tener tres niveles de dificultad con rangos de tiempo de reacción distintos. El tiempo efectivo de reacción DEBE ser aleatorio dentro del rango de la dificultad activa.

#### Scenario: Dificultad fácil — reacción lenta

- GIVEN la dificultad activa es `easy`
- WHEN la señal Bang es emitida
- THEN el tiempo de reacción del bot MUST ser un valor aleatorio uniforme en el rango **[600 ms, 1200 ms]**
- AND un jugador promedio SHOULD ganar consistentemente en esta dificultad

#### Scenario: Dificultad media — reacción razonable

- GIVEN la dificultad activa es `medium`
- WHEN la señal Bang es emitida
- THEN el tiempo de reacción del bot MUST ser un valor aleatorio uniforme en el rango **[300 ms, 600 ms]**
- AND el resultado SHOULD ser incierto para la mayoría de los jugadores

#### Scenario: Dificultad difícil — reacción muy rápida

- GIVEN la dificultad activa es `hard`
- WHEN la señal Bang es emitida
- THEN el tiempo de reacción del bot MUST ser un valor aleatorio uniforme en el rango **[150 ms, 300 ms]**
- AND solo un jugador con reflejos por encima de la media SHOULD ganar consistentemente

#### Scenario: Cálculo del tiempo de reacción aleatorio

- GIVEN una dificultad activa con rango `[min, max]`
- WHEN `BotGameService` calcula `botReactionMs`
- THEN MUST usar `Math.floor(Math.random() * (max - min + 1)) + min` o equivalente
- AND el resultado MUST estar siempre dentro del rango `[min, max]` inclusive

#### Scenario: False start del bot por dificultad difícil

- GIVEN la dificultad activa es `hard`
- WHEN `BotGameService` determina si el bot comete false start
- THEN el bot MAY tener una pequeña probabilidad configurable de false start (p. ej. 5%)
- AND si el false start ocurre, MUST hacerlo antes de la señal Bang (durante `waiting-bang`)

#### Scenario: Dificultades fácil y media no cometen false start

- GIVEN la dificultad activa es `easy` o `medium`
- WHEN la fase es `waiting-bang`
- THEN el bot MUST NOT cometer false start
- AND el bot MUST esperar siempre a la señal Bang

---

## ranking

### Requirement: Exclusión total de las partidas bot del ranking

Las partidas contra bot son locales y NO DEBEN reportarse al servidor bajo ninguna circunstancia. Ningún evento SignalR DEBE ser emitido durante una sesión bot, excepto los necesarios para cancelar la cola previa si es que el jugador estaba buscando partida.

#### Scenario: No se emiten eventos de resultado al servidor en partidas bot

- GIVEN el jugador ha completado una partida bot (cualquier resultado)
- WHEN `GameStateService` transiciona a `result`
- THEN `GameHubService` MUST NOT ser llamado para reportar el resultado
- AND ningún evento SignalR de tipo `RoundResult`, `PlayerTapped` o equivalente MUST ser emitido
- AND el ranking del jugador en el servidor MUST permanecer inalterado

#### Scenario: No se emiten eventos de partida al servidor durante la sesión bot

- GIVEN el jugador está en cualquier fase de una partida bot
- WHEN `BotGameService` avanza las fases (`start`, `playerReady`, `bang`, `playerTapped`, `rematch`)
- THEN `GameHubService` MUST NOT ser instanciado ni llamado en ninguno de esos métodos
- AND la conexión SignalR MUST permanecer inactiva durante toda la sesión bot

#### Scenario: Cancelación de cola previa al activar bot

- GIVEN el jugador estaba en la cola de matchmaking aleatorio
- WHEN el bot es activado (por timeout o manualmente)
- THEN `GameHubService.leaveRoom()` o equivalente MUST ser llamado ANTES de iniciar la sesión bot
- AND tras la cancelación, NO DEBEN emitirse más eventos SignalR durante la partida bot

#### Scenario: Revancha bot no reportada

- GIVEN el jugador solicita revancha en una partida bot
- WHEN `botGameService.rematch()` es llamado
- THEN el servidor MUST NOT recibir ninguna solicitud de revancha
- AND la revancha MUST gestionarse íntegramente en `BotGameService`

#### Scenario: Historial y estadísticas no actualizados

- GIVEN el jugador completa una o varias partidas bot
- WHEN el jugador accede al ranking o historial de partidas (si existe esa vista)
- THEN las partidas bot MUST NOT aparecer en el historial del servidor
- AND el win/loss ratio del jugador MUST NOT verse afectado por partidas bot

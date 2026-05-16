---
status: implemented
last_change: cross-cutting-spec-extraction
last_verified: 2026-05-16
pending: |
  - Ninguno — feature al 100% con 213/213 tests
---

# Bang Game Specification — Frontend (local)

> **Contrato cross-cutting**: el contrato observable con el backend (endpoints REST, métodos del hub SignalR, eventos servidor→cliente, payloads, máquina de estados de la sala, reglas de arbitraje y temporización) vive en `specs/bang-game.spec.md` en la raíz del monorepo. Este spec describe el CÓMO del frontend (UI, flujos, fases visuales), no el contrato.

## auth

### Requirement: Registro opcional sin email

El sistema MUST permitir crear cuenta con username + password únicamente (sin email). El sistema MUST permitir jugar como invitado sin cuenta. Los invitados MAY jugar partidas pero MUST NOT aparecer en el ranking.

La autenticación es accesible mediante un icono de usuario en la cabecera del lobby. Al entrar directamente al lobby sin sesión previa, el sistema asigna automáticamente una identidad de invitado.

#### Scenario: Registro desde el lobby

- GIVEN un visitante en el lobby (con identidad de invitado auto-asignada)
- WHEN pulsa el icono de usuario en la cabecera y selecciona "Registrarse"
- WHEN introduce username único y password y pulsa "Registrarse"
- THEN se crea la cuenta, queda autenticado y el modal se cierra

#### Scenario: Inicio de sesión desde el lobby

- GIVEN un visitante en el lobby
- WHEN pulsa el icono de usuario en la cabecera
- WHEN introduce credenciales válidas y pulsa "Iniciar sesión"
- THEN queda autenticado y el modal se cierra

#### Scenario: Username ya en uso

- GIVEN un visitante intentando registrarse
- WHEN introduce un username ya existente
- THEN el sistema MUST mostrar error "Username no disponible"

#### Scenario: Cerrar sesión

- GIVEN un usuario autenticado en el lobby
- WHEN pulsa el icono de usuario (muestra su inicial) y pulsa "Cerrar sesión"
- THEN la sesión se cierra y el icono vuelve al estado de invitado

#### Scenario: Acceso directo como invitado

- GIVEN un visitante sin sesión previa
- WHEN accede a la URL del lobby
- THEN el sistema asigna automáticamente una identidad de invitado y muestra el lobby directamente

---

## matchmaking

### Requirement: Sala aleatoria

El sistema MUST emparejar al jugador con otro jugador en espera. Si no hay nadie en espera, MUST mantener al jugador en cola hasta que llegue un oponente.

#### Scenario: Emparejamiento exitoso

- GIVEN un jugador en cola de matchmaking
- WHEN otro jugador entra en cola
- THEN ambos son redirigidos a la misma sala de juego

#### Scenario: Espera sin oponente

- GIVEN un jugador en cola de matchmaking
- WHEN no hay oponentes disponibles
- THEN el sistema MUST mostrar estado "Buscando rival…" hasta encontrar uno

---

## private-room

### Requirement: Sala privada con código

El sistema MUST permitir crear una sala privada con código alfanumérico único de 6 caracteres. El sistema MUST permitir unirse a una sala introduciendo su código.

#### Scenario: Crear sala privada

- GIVEN un jugador autenticado o invitado en el lobby
- WHEN pulsa "Crear sala privada"
- THEN se genera y muestra un código de sala compartible

#### Scenario: Unirse por código

- GIVEN un jugador con código de sala válido
- WHEN introduce el código y pulsa "Unirse"
- THEN entra en esa sala y espera al anfitrión

#### Scenario: Código inválido

- GIVEN un jugador intentando unirse
- WHEN introduce un código inexistente o expirado
- THEN el sistema MUST mostrar error "Sala no encontrada"

---

## game-session

### Requirement: Flujo de partida

El sistema MUST ejecutar: ambos marcan listos → countdown ("Preparados" → "Listos") → retardo oculto aleatorio 100–1000ms → señal BANG → captura de reacción → resultado.

El área tappable MUST ocupar toda la altura disponible de forma consistente durante las fases countdown, waiting-bang y bang-active, sin huecos entre fases, para evitar que un jugador apoye el dedo en un hueco antes del BANG.

#### Scenario: Partida normal — primer toque gana

- GIVEN dos jugadores listos en sala
- WHEN aparece la señal BANG y el jugador A toca antes que B
- THEN el sistema MUST declarar ganador a A y perdedor a B con sus tiempos de reacción

#### Scenario: False start — toque antes del BANG

- GIVEN fase de countdown ("Preparados" / "Listos") o retardo activa
- WHEN un jugador toca la pantalla antes de la señal BANG
- THEN el sistema MUST enviar el tap al servidor, que declara perdedor inmediato a ese jugador
- MUST NOT bloquear el tap en el frontend — el área es tappable en todas las fases activas

#### Scenario: Aviso de oponente listo

- GIVEN dos jugadores en sala esperando en fase waiting-opponent
- WHEN uno de los jugadores pulsa "¡Listo!"
- THEN el otro jugador MUST ver el aviso "✓ [username] está listo" sin cambiar de fase

#### Scenario: Repetir partida

- GIVEN pantalla de resultado post-partida
- WHEN ambos jugadores pulsan "Repetir"
- THEN se inicia una nueva partida en la misma sala

#### Scenario: Aviso de oponente quiere repetir

- GIVEN pantalla de resultado post-partida
- WHEN un jugador pulsa "Repetir" pero el otro aún no
- THEN el oponente MUST ver el aviso "Tu oponente quiere repetir" y el botón "Repetir" destaca visualmente
- Ver detalle completo en `rematch-notification.spec.md`

#### Scenario: Jugar con otro

- GIVEN pantalla de resultado post-partida
- WHEN un jugador pulsa "Jugar con otro"
- THEN sale de la sala y vuelve a la cola de matchmaking

#### Scenario: Abandono de partida por el oponente

- GIVEN una partida en cualquier fase
- WHEN el oponente abandona la sala
- THEN el sistema MUST mostrar toast informativo inmediatamente y MUST redirigir al lobby tras 5 segundos, manteniendo la pantalla actual visible durante ese tiempo

---

## ranking

### Requirement: Tabla de ranking pública

El sistema MUST mostrar ranking de jugadores registrados con victorias totales, tiempo de reacción medio y ratio victorias/partidas. El sistema MUST permitir ordenar por cualquiera de esas columnas.

#### Scenario: Visualización del ranking

- GIVEN cualquier usuario (autenticado o invitado)
- WHEN accede a la sección Ranking
- THEN ve la tabla ordenada por victorias descendente por defecto

#### Scenario: Cambio de ordenación

- GIVEN la tabla de ranking visible
- WHEN pulsa la cabecera de "Tiempo medio"
- THEN la tabla se reordena por esa columna

#### Scenario: Invitado no aparece en ranking

- GIVEN una partida completada por un jugador invitado
- WHEN se consulta el ranking
- THEN el jugador invitado MUST NOT aparecer en la tabla

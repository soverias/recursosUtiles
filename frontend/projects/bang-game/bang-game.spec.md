# Bang Game Specification

## auth

### Requirement: Registro opcional sin email

El sistema MUST permitir crear cuenta con username + password únicamente (sin email). El sistema MUST permitir jugar como invitado sin cuenta. Los invitados MAY jugar partidas pero MUST NOT aparecer en el ranking.

#### Scenario: Registro exitoso

- GIVEN un visitante en la pantalla de entrada
- WHEN introduce username único y password y pulsa "Registrarse"
- THEN se crea la cuenta, queda autenticado y accede al lobby

#### Scenario: Username ya en uso

- GIVEN un visitante intentando registrarse
- WHEN introduce un username ya existente
- THEN el sistema MUST mostrar error "Username no disponible"

#### Scenario: Jugar como invitado

- GIVEN un visitante en la pantalla de entrada
- WHEN pulsa "Jugar como invitado"
- THEN accede al lobby con identidad temporal (no persiste entre sesiones)

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

El sistema MUST ejecutar: ambos marcan listos → countdown visible 3s → retardo oculto aleatorio 100–1000ms → señal BANG → captura de reacción → resultado.

#### Scenario: Partida normal — primer toque gana

- GIVEN dos jugadores listos en sala
- WHEN aparece la señal BANG y el jugador A toca antes que B
- THEN el sistema MUST declarar ganador a A y perdedor a B con sus tiempos de reacción

#### Scenario: False start — toque antes del BANG

- GIVEN fase de countdown o retardo activa
- WHEN un jugador toca la pantalla antes de la señal BANG
- THEN el sistema MUST declarar perdedor inmediato a ese jugador

#### Scenario: Repetir partida

- GIVEN pantalla de resultado post-partida
- WHEN ambos jugadores pulsan "Repetir"
- THEN se inicia una nueva partida en la misma sala

#### Scenario: Jugar con otro

- GIVEN pantalla de resultado post-partida
- WHEN un jugador pulsa "Jugar con otro"
- THEN sale de la sala y vuelve a la cola de matchmaking

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

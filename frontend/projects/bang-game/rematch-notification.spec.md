# Spec: rematch-notification

## Descripción general

Cuando un jugador pulsa "Repetir" al finalizar una partida, el oponente —que también está en la pantalla de resultado— recibe una notificación visible informándole de que el otro jugador quiere volver a jugar. Esto crea presión social y mejora la retención de partidas consecutivas.

El flujo de rematch existente no cambia: ambos jugadores deben confirmar "Repetir" para que arranque la siguiente ronda. Solo se añade la notificación al oponente.

---

## Casos de uso / flujos principales

### Flujo 1 — A pulsa "Repetir" antes que B

```
A pulsa "Repetir"
  → A: pasa a fase waiting-rematch ("Esperando al oponente…")
  → Servidor emite OpponentWantsRematch a B
  → B: sigue en fase result, pero ve el aviso "Tu oponente quiere repetir"
  → B pulsa "Repetir"
  → Servidor emite BothReady a ambos
  → Ambos: inician nueva ronda
```

### Flujo 2 — B pulsa "Repetir" antes que A

```
B pulsa "Repetir"
  → B: pasa a fase waiting-rematch
  → Servidor emite OpponentWantsRematch a A
  → A: sigue en fase result, ve el aviso "Tu oponente quiere repetir"
  → A pulsa "Repetir"
  → Servidor emite BothReady a ambos
  → Ambos: inician nueva ronda
```

### Flujo 3 — B ignora y pulsa "Jugar con otro"

```
A pulsa "Repetir"
  → Servidor emite OpponentWantsRematch a B
  → B pulsa "Jugar con otro"
  → B: navega al lobby
  → Servidor emite OpponentLeft a A
  → A: toast "Tu oponente ha abandonado la partida" + reset + lobby
```

### Flujo 4 — Ninguno pulsa "Repetir" (ambos pulsan "Jugar con otro")

Sin cambios respecto al comportamiento actual: cada jugador navega al lobby independientemente.

---

## Validaciones y reglas de negocio

- `OpponentWantsRematch` solo se emite si el receptor está aún en la pantalla de resultado (fase `result`). Si ya confirmó su propio "Repetir" (fase `waiting-rematch`), el servidor lo procesa directamente como `BothReady`.
- El aviso al oponente es puramente informativo: no bloquea ningún botón ni cambia la fase del receptor.
- El botón "Repetir" del receptor NO se activa automáticamente al recibir el evento: el jugador debe confirmarlo explícitamente.
- Si el oponente abandona la sala (OpponentLeft) después de haber emitido `OpponentWantsRematch`, el aviso desaparece y el jugador vuelve al estado de resultado sin notificación (o bien recibe OpponentLeft y navega al lobby según el handler ya existente).

---

## Criterios de aceptación

| Situación | Resultado esperado |
|-----------|-------------------|
| Jugador A pulsa "Repetir" | A transita a `waiting-rematch`; B recibe evento `OpponentWantsRematch` del servidor |
| B recibe `OpponentWantsRematch` estando en `result` | `ResultComponent` de B muestra el aviso "Tu oponente quiere repetir" sin cambiar de fase |
| B pulsa "Repetir" tras ver el aviso | Servidor emite `BothReady`; ambos inician nueva ronda |
| B pulsa "Jugar con otro" tras ver el aviso | B navega al lobby; A recibe `OpponentLeft` y también va al lobby |
| A pulsa "Repetir" y B ya había pulsado "Repetir" | El servidor emite `BothReady` directamente (sin pasar por el aviso) |
| B recibe `OpponentWantsRematch` y ya está en `waiting-rematch` | El servidor resuelve `BothReady`; el aviso nunca llega al frontend de B |
| El aviso está visible y el oponente abandona (`OpponentLeft`) | El handler existente de `OpponentLeft` toma el control: toast + reset + lobby |

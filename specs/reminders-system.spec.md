---
status: partial
coverage:
  backend: implemented
  frontend: implemented
last_change: reminders-system
last_verified: 2026-05-17
pending: |
  - Validación E2E desde móvil real con PWA instalada (Android Chrome y iOS Safari 16.4+)
  - Cierre del SDD vía /sdd-archive tras validación humana
---

# Spec: reminders-system

Cross-cutting spec del sistema de recordatorios push para `habit-tracker`. Define el contrato observable entre cliente y servidor. Los specs locales (backend `Reminders` module + frontend habit-tracker delta) describen el cómo de cada lado.

## Visión

El usuario configura recordatorios diarios por hábito ("recuérdame tomar la pastilla a las 20:00"). El sistema le envía una notificación push a esa hora, **solo si el hábito aún no está marcado como hecho hoy**. Si ya lo marcó antes, no le molesta.

## Principio de privacidad

El backend **NUNCA** conoce el nombre, emoji ni estado de los hábitos del usuario. Solo conoce:
- Que un `userId` quiere recibir un ping a `localTime` en `timezone` para un `habitId` opaco
- Su `pushSubscription` (endpoint del browser vendor)

La inteligencia condicional vive en el Service Worker del cliente, que lee IndexedDB local antes de mostrar la notificación.

## Auth

Todos los endpoints `/api/reminders` (salvo `/vapid-public-key`) requieren JWT bearer válido. El `userId` se extrae del claim `sub` del token.

## Contrato HTTP

### `GET /api/reminders/vapid-public-key`

Endpoint público, sin auth. El cliente lo llama una vez al activar recordatorios para obtener la clave pública con la que crear la subscription.

**Response 200**:
```json
{ "publicKey": "BNbXxYz..." }
```

### `GET /api/reminders`

Lista los recordatorios del usuario autenticado.

**Auth**: requerida.

**Response 200**:
```json
[
  {
    "id": "uuid",
    "habitId": "uuid",
    "localTime": "20:00",
    "timezone": "Europe/Madrid",
    "createdAt": "2026-05-17T14:00:00Z"
  }
]
```

### `POST /api/reminders`

Crea o actualiza el recordatorio para un hábito. Idempotente por `(userId, habitId)` — si ya existe, se actualiza.

**Auth**: requerida.

**Request**:
```json
{
  "habitId": "uuid",
  "localTime": "20:00",
  "timezone": "Europe/Madrid",
  "pushSubscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "habitId": "uuid",
  "localTime": "20:00",
  "timezone": "Europe/Madrid",
  "createdAt": "2026-05-17T14:00:00Z"
}
```

**Errores**:
- 400 si `localTime` no tiene formato `HH:mm` (00:00–23:59) o `timezone` no es IANA válido
- 401 sin auth

### `DELETE /api/reminders/{id}`

Elimina el recordatorio. Solo el dueño puede eliminarlo.

**Auth**: requerida.

**Response 204** vacío.

**Errores**:
- 401 sin auth
- 403 si el `id` no pertenece al `userId` del token
- 404 si no existe

## Push payload

Cuando el `HostedService` dispara un recordatorio, envía push con este payload (JSON serializado):

```json
{ "habitId": "uuid", "type": "reminder" }
```

**Sin nombre, sin emoji, sin texto del recordatorio.** El Service Worker del cliente reconstruye la notificación localmente desde IndexedDB.

## Comportamiento del Service Worker

### Requirement: Decisión condicional local

GIVEN un evento `push` recibido con payload `{ habitId, type: "reminder" }`
WHEN el SW procesa el evento
THEN MUST consultar IndexedDB local (DB `habit-tracker`, store `habits`, key `habitId`)
AND:
- Si el hábito está marcado en la fecha de hoy (`marks` incluye `YYYY-MM-DD` actual) → `event.waitUntil(Promise.resolve())` sin mostrar notificación
- Si NO está marcado → mostrar notificación con `title: emoji + ' ' + name + '?'` y `body: '¿Hecho hoy?'`

### Requirement: Hábito eliminado

GIVEN un push con `habitId` que ya no existe en IndexedDB (el usuario eliminó el hábito pero el reminder server-side aún no fue limpiado)
WHEN el SW procesa el evento
THEN MUST descartar silenciosamente sin mostrar notificación ni lanzar error

## Comportamiento del HostedService

### Requirement: Ventana de disparo

CADA minuto (cron interno del HostedService) MUST ejecutarse una query que devuelve los recordatorios cuyo `localTime` en su `timezone` coincide con la hora actual del servidor convertida a esa misma `timezone`.

### Requirement: Manejo de 410 Gone

GIVEN un push con `pushSubscription` que ya no es válida (browser revocó)
WHEN `IPushSenderService` recibe `410 Gone` del endpoint
THEN MUST eliminar el row de la tabla `reminders` correspondiente

### Requirement: Otros errores de push

GIVEN errores transitorios (5xx, timeout)
WHEN ocurren al enviar push
THEN MUST loggearse pero NO eliminar el row — siguiente ejecución reintentará

## Comportamiento del cliente habit-tracker

### Requirement: Activar recordatorio

GIVEN un hábito en la lista
WHEN el usuario tap `🔔 Recordar` y selecciona una hora
THEN:
- MUST llamar `SwPush.requestSubscription({ serverPublicKey })` (pedirá permiso al navegador la primera vez)
- MUST POST a `/api/reminders` con el subscription
- MUST mostrar visualmente el recordatorio activo en la card: `🔔 20:00`

### Requirement: Desactivar recordatorio

GIVEN un recordatorio activo en una card
WHEN el usuario tap long press en el badge `🔔 20:00`
THEN MUST DELETE el recordatorio en backend y quitar el badge

### Requirement: Auth requerida

GIVEN un usuario anónimo (sin sesión)
WHEN intenta activar un recordatorio
THEN MUST mostrarse la pantalla de login/registro antes de proceder

### Requirement: Timezone tracking

GIVEN un usuario que abre la app
WHEN se inicializa
THEN MUST capturar `Intl.DateTimeFormat().resolvedOptions().timeZone`
AND si difiere de la timezone guardada de cualquiera de sus recordatorios MUST hacer PUT silencioso para actualizarla

## Compatibilidad

- **Chrome Android, Firefox desktop/Android**: funciona out-of-the-box
- **Safari iOS 16.4+**: funciona SOLO si la PWA está instalada como app (desde "Compartir → Añadir a inicio")
- **Safari macOS**: no soportado oficialmente
- **Edge**: equivalente a Chrome (mismo motor)

El UI MUST detectar `'Notification' in window && 'PushManager' in window` antes de mostrar el botón `🔔 Recordar`. Si no hay soporte, mostrar mensaje "Tu navegador no soporta recordatorios push".

---
status: implemented
last_change: reminders-system
last_verified: 2026-05-17
---

# Spec: Reminders module (backend)

Backend del sistema de recordatorios push. Implementa el contrato definido en `../../../specs/reminders-system.spec.md`. Este spec describe el cómo interno del módulo; el qué observable vive en el spec cross-cutting.

## Estructura layered

```
src/Reminders/
├── Reminders.Domain/
│   ├── Entities/Reminder.cs                 — composite identity (UserId, HabitId)
│   ├── ValueObjects/LocalTime.cs            — "HH:mm" parsed + validated
│   ├── ValueObjects/PushSubscriptionVo.cs   — endpoint + p256dh + auth
│   └── Ports/
│       ├── IReminderRepository.cs
│       ├── IPushSenderService.cs            — Ok | Gone | Transient
│       └── IRemindersKicker.cs              — exposed by HostedService
├── Reminders.Application/
│   ├── DTOs/ReminderDtos.cs
│   └── UseCases/
│       ├── ListUserRemindersUseCase.cs
│       ├── UpsertReminderUseCase.cs         — idempotente por (userId, habitId)
│       └── DeleteReminderUseCase.cs         — composite delete, 404 si no es del user
└── Reminders.Infrastructure/
    ├── Persistence/
    │   ├── DbConnectionFactory.cs           — Npgsql, copia local (no compartida)
    │   └── ReminderRepository.cs
    ├── Push/WebPushSenderService.cs         — paquete NuGet `WebPush 1.0.12`
    ├── Hosted/RemindersHostedService.cs     — self-scheduling cron + kick channel
    ├── Options/VapidOptions.cs              — bound a "Vapid" config section
    └── Extensions/ServiceCollectionExtensions.cs   — AddReminders()
```

## Persistencia

Una sola tabla `reminders` con PK compuesta `(user_id, habit_id)`. Sin columna `id` sintética — la identidad natural es la composición. Schema appendido a `docker/init.sql`.

Índice extra: `idx_reminders_last_fired ON reminders(last_fired_date)` sin INCLUDE — simple B-tree, decisión tomada por escala actual (pocos cientos de filas previstas; PostgreSQL hace seq scan en sub-ms y la diferencia con index-only scan no compensa el coste de duplicar la tabla).

## Cron — Patrón self-scheduling + kick channel

`RemindersHostedService` extends `BackgroundService` AND implementa `IRemindersKicker`. Registro DI:
- Singleton del propio `RemindersHostedService` (hosted services lo son por contrato)
- `IRemindersKicker` resuelve a la misma instancia
- `AddHostedService(sp => sp.GetRequiredService<RemindersHostedService>())` para que el host lo arranque

Loop principal:
1. `ProcessDueAsync` — query de "due now" + send por cada uno
2. `CalculateNextFiringAsync` — `MIN(next firing UTC)` sobre todos los reminders
3. `Task.WhenAny(Task.Delay, _kick.Reader.WaitToReadAsync)` — duerme hasta el próximo evento o hasta que llegue un kick
4. Drena el channel y vuelve a 1

Si no hay reminders, fallback de despertar cada 1h por seguridad.

## Privacy invariant

El backend NUNCA conoce el nombre, emoji ni estado de los hábitos. Solo conoce:
- `(userId, habitId)` — pares opacos
- `localTime + timezone` — horario de disparo
- `pushSubscription` — credenciales del browser para enviar push

El payload de la push es solo `{ habitId, type: "reminder" }`. El Service Worker del cliente lee IndexedDB local antes de mostrar.

## Lógica de disparo

Query "due now":
```sql
SELECT ... FROM reminders r WHERE
  ((date_trunc('day', now() AT TIME ZONE r.timezone)
    + (r.local_time || ':00')::interval) AT TIME ZONE r.timezone) <= now()
  AND (r.last_fired_date IS NULL
       OR r.last_fired_date < (now() AT TIME ZONE r.timezone)::date)
```

Características:
- Dispara TODO lo cuyo firing UTC ya pasó y aún no se ha disparado hoy local
- Dedupe diario por `last_fired_date`
- Robusto a caídas (hasta 24h): cuando el server vuelve, dispara los pendientes de hoy
- Sin spam histórico: solo dispara HOY, no recupera días pasados
- DST automático vía `AT TIME ZONE`

## Edge case — Reminder creado después de su hora

En `UpsertReminderUseCase`, si el insert es nuevo y `currentLocalTime > localTime`, marca `last_fired_date = today_local` en el INSERT. Así "hoy ya está hecho, próximo disparo mañana". Evita que se envíe una notificación inútil a las 22:00 cuando el reminder es para las 20:00.

## Endpoints HTTP

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/reminders/vapid-public-key` | No | Devuelve la clave pública VAPID |
| GET | `/api/reminders` | JWT | Lista los recordatorios del user |
| POST | `/api/reminders` | JWT | Upsert por (user_id, habit_id) |
| DELETE | `/api/reminders/{habitId}` | JWT | Elimina el recordatorio del user |

Controllers en `src/RecursosUtiles.Api/Controllers/Reminders/`. Auth via `[Authorize]` (primer caso de REST autenticado en el proyecto — hasta ahora solo SignalR hub lo usaba).

## Configuración

Variables de entorno requeridas:
- `Vapid:PublicKey` — clave pública generada con `npx web-push generate-vapid-keys`
- `Vapid:PrivateKey` — clave privada (NUNCA commitear)
- `Vapid:Subject` — email del owner (`mailto:...`)

CORS: cualquier origen donde se sirva el frontend debe estar en `Cors:AllowedOrigins`. En prod actualmente: `http://192.168.1.101:5015`, `http://localhost:4200`, `http://localhost:4201` (los dos últimos para dev local apuntando a prod backend).

## Manejo de errores en push

- `WebPushException` con `HttpStatusCode.Gone` (410) o `NotFound` (404) → `PushSendResult.Gone` → DELETE row inline
- Cualquier otra excepción → `PushSendResult.Transient` → loggear, próximo ciclo reintentará
- Sin VAPID configurado → `Transient` + error log

## Schema migration

No hay EF migrations. La tabla se introdujo apendizando a `docker/init.sql` Y aplicando el SQL manualmente a la BBDD existente del server vía `docker exec ... psql`. Para futuras migraciones, mismo patrón: editar init.sql + aplicar a mano. Si la cadencia de cambios de schema crece, valorar introducir DbUp.

## Deploy notes

- El Dockerfile lista TODOS los csproj en el bloque de restore. Si se añade un módulo nuevo, hay que añadir su csproj al Dockerfile o el build falla con NETSDK1004 ("Assets file ... not found").
- El `docker-compose.yml` del server propaga las VAPID env vars al container backend.

## Pendientes

- Validación E2E desde móvil real (depende del lado frontend, ver `../habit-tracker.spec.md`)
- Cierre formal del SDD vía `/sdd-archive reminders-system` tras validación
- Warning transitivo: `WebPush 1.0.12` arrastra `Newtonsoft.Json 10.0.3` con CVE GHSA-5crp-9r3c-p9vr (gravedad alta). Mitigar al actualizar a una versión más nueva del paquete o moverse a `Lib.Net.Http.WebPush`.

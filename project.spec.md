---
status: implemented
last_change: project-spec-elevation
last_verified: 2026-05-16
---

# project.spec.md — RecursosUtiles

## Visión

Tienda de aplicaciones gratuitas, simples y de uso rápido. Cada herramienta es instalable como PWA independiente directamente desde el navegador, sin necesidad de instalar nada externo.

## Principios de diseño

### 1. Sin backend por defecto

Las herramientas se diseñan para funcionar **enteramente en el cliente** siempre que sea posible. El backend SOLO se introduce cuando una funcionalidad lo requiere de forma esencial (multijugador en tiempo real, persistencia compartida entre usuarios, ranking público, etc.).

Cualquier herramienta que pueda resolverse con cómputo local + almacenamiento del navegador (`localStorage`, `sessionStorage`, `IndexedDB`) **DEBE** implementarse sin servidor. Esto incluye calculadoras, generadores, conversores, juegos individuales, organizadores personales, etc.

Cuando una feature requiera servidor, debe justificarse explícitamente en su proposal (qué requisito hace imposible la versión client-only).

### 2. PWA instalable

Toda app del catálogo MUST ser instalable como PWA: manifest, service worker, iconos, funciona offline en lo posible. El usuario instala desde el navegador sin pasar por App Store ni Play Store.

### 3. Uso rápido

Sin onboarding, sin login obligatorio salvo que la herramienta lo exija. La primera interacción útil debe estar a menos de un clic desde la apertura.

### 4. Reutilización vía shared

Componentes y servicios comunes viven en `frontend/projects/shared/`. Antes de crear UI en una app, comprobar si ya existe en el shared.

---

## Estructura del monorepo

```
recursosUtiles/
├── frontend/   ← Angular 21.2 workspace (multi-proyecto PWA)
├── backend/    ← .NET 10 solution (solo para apps que requieran servidor)
├── specs/      ← Specs cross-cutting (contratos compartidos FE↔BE)
└── .claude/    ← Configuración compartida del agente
```

### Apps frontend

```
frontend/projects/
  shared/         ← librería UI compartida (no es PWA, no tiene app root)
  store/          ← tienda principal (PWA, client-only)
  secret-friend/  ← Secret Friend (PWA, client-only)
  calculator/     ← Calculator + Unit Converter (PWA, client-only)
  bang-game/      ← Bang Game (PWA, requiere backend — multijugador en tiempo real)
```

Cada app (store, secret-friend, calculator, bang-game) tiene su propio `manifest.webmanifest`, service worker y `ngsw-config.json`.

El shared se consume con el alias `@shared/*` → `projects/shared/src/*` (definido en el `tsconfig.json` raíz de `frontend/`).
Ver `frontend/projects/shared/shared.spec.md` para la API completa y convenciones de uso.

### Bounded contexts backend

```
backend/src/
  RecursosUtiles.Api/    ← Web API entry point + Hubs SignalR
  SharedKernel/          ← primitivas DDD (Result, Entity, ValueObject)
  BangGame/              ← bounded context de Bang Game (Domain/Application/Infrastructure)
```

El backend SOLO sirve a las apps que lo requieren. Hoy: bang-game.

---

## Stack

### Frontend
- **Framework**: Angular 21.2, standalone components (sin `standalone: true` explícito)
- **UI**: Tailwind CSS v4 (sin Angular Material, sin custom CSS salvo excepción justificada)
- **Lenguaje**: TypeScript 5.9
- **State**: Signals (`signal()`, `computed()`, `input()`, `output()`)
- **Change detection**: `ChangeDetectionStrategy.OnPush` siempre
- **Testing**: Vitest vía `@angular/build:unit-test`, jsdom
- **Comunicación en tiempo real**: SignalR — solo en apps que lo requieran

### Backend
- **Framework**: .NET 10 · ASP.NET Core
- **Comunicación**: SignalR · REST
- **Persistencia**: PostgreSQL 17 · Npgsql (ADO.NET puro, sin ORM)
- **Auth**: JWT HS256
- **Arquitectura**: Clean Architecture / DDD / Hexagonal

---

## Comandos clave

### Frontend
```bash
cd frontend
ng serve --project <nombre>
ng build --project <nombre>
ng test --project <nombre> --watch=false
```

### Backend
```bash
cd backend/docker && docker compose up -d   # PostgreSQL
cd backend && dotnet run --project src/RecursosUtiles.Api
dotnet test                                 # tests
```

---

## Specs

### Cross-cutting (raíz `specs/`)

Specs que describen contrato observable compartido entre frontend y backend.

| Spec | Estado |
|------|--------|
| `specs/bang-game.spec.md` | partial (FE implemented, BE implemented con drift de timing) |

### Locales

Cada proyecto tiene sus propios specs co-localizados:
- `frontend/project.spec.md` (este fichero referencia el monorepo completo; el de frontend desaparece como duplicado)
- `frontend/projects/<app>/<app>.spec.md` — spec local de cada app
- `backend/src/<BoundedContext>/<context>.spec.md` — spec local de cada bounded context

Todos los specs DEBEN llevar header YAML con `status`, `last_change`, `last_verified` (y `coverage` si son cross-cutting).

---

## Metodología

**Spec-Driven Development (SDD)** con strict TDD (RED → GREEN → TRIANGULATE).

Flujo por change: `proposal → spec → design → tasks → apply → verify → archive`.

Artefactos co-localizados con el código:
- `<change>.spec.md` — requisitos y escenarios BDD
- `<change>.design.md` — decisiones técnicas y arquitectura
- `<change>.tasks.md` — checklist de implementación

Cualquier change cross-cutting (toca FE y BE) DEBE actualizar el spec correspondiente en `specs/` ANTES de implementar.

---

## Convenciones de código

- Código en inglés siempre (variables, clases, endpoints, columnas SQL, mensajes de error de API, claves de i18n)
- Textos visibles al usuario en castellano (idioma del locale)
- Frontend: standalone, OnPush, signals, Tailwind, lazy routes con functional guards
- Backend: hexagonal estricto, Domain sin dependencias externas, Result\<T\> para errores esperados

---

## Estado de los proyectos

### Frontend

| Proyecto | Nombre | Backend? | Estado | Tests |
|----------|--------|----------|--------|-------|
| `store` | Store | No | ✅ implementado | 28/28 |
| `secret-friend` | Secret Friend | No | ✅ implementado | 98/98 |
| `calculator` | Calculadora | No | ✅ implementado | 130/130 |
| `bang-game` | Bang Game | Sí | ✅ implementado | 213/213 |

### Backend

| Bounded context | Estado | Notas |
|-----------------|--------|-------|
| `server-scaffold` | ✅ archivado | Solución, SharedKernel, API base, Docker, health checks |
| `BangGame` | ✅ implementado | Timing alineado con spec. 68/68 tests verdes (incluye gate de persistencia de invitados y unicidad de RoomCode). |

---

> Para instrucciones dirigidas a agentes IA, ver `frontend/AGENTS.md` y `backend/AGENTS.md`.
> Para el contrato cross-cutting de bang-game, ver `specs/bang-game.spec.md`.

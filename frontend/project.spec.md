# project.spec.md — RecursosUtiles

## Visión

Tienda de aplicaciones gratuitas, simples y de uso rápido. Cada herramienta es instalable como PWA independiente directamente desde el navegador, sin necesidad de instalar nada externo.

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
- **Framework**: .NET Core
- **Comunicación**: SignalR
- **Arquitectura**: Hexagonal con DDD
- **Nota**: gestionado desde un repositorio independiente

## Workspace

Multi-proyecto Angular:

```
projects/
  store/          ← tienda principal (PWA)
  secret-friend/ ← Secret Friend (PWA)
  bang-game/      ← Bang Game (PWA)
```

Cada proyecto tiene su propio `manifest.webmanifest`, service worker y `ngsw-config.json`.

## Comandos clave

```bash
ng serve --project <nombre>
ng build --project <nombre>
ng test --project <nombre> --watch=false
```

## Metodología

**Spec-Driven Development (SDD)** con strict TDD (RED → GREEN → TRIANGULATE).

Cada change tiene artefactos co-localizados en `projects/<app>/`:
- `<change>.spec.md` — requisitos y escenarios BDD
- `<change>.design.md` — decisiones técnicas y arquitectura
- `<change>.tasks.md` — checklist de implementación

## Convenciones de código

- Standalone components por defecto (NO `standalone: true` explícito)
- `ChangeDetectionStrategy.OnPush` siempre
- Signals para inputs/outputs/state
- Tailwind para todo el estilo
- `@Injectable({ providedIn: 'root' })` para servicios compartidos
- Lazy-loaded routes con functional guards

## Estado de los proyectos

| Proyecto | Nombre | Estado | Tests |
|----------|--------|--------|-------|
| `store` | Store | ✅ | 28/28 |
| `secret-friend` | Secret Friend | ✅ | 98/98 |
| `bang-game` | Bang Game | ✅ | 85/85 |

---

> Para instrucciones dirigidas a agentes IA, ver `AGENTS.md`.

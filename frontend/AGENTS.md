# AGENTS.md — Instrucciones para agentes IA

Lee este fichero antes de actuar en cualquier tarea de este proyecto.

## Contexto del proyecto

Lee `../project.spec.md` (en la raíz del monorepo) para entender qué es el proyecto, sus principios (importante: **sin backend por defecto**), el stack y la arquitectura acordada.

## Metodología: Spec-Driven Development (SDD)

Todo cambio relevante sigue el flujo SDD:

```
proposal → specs → design → tasks → apply → verify → archive
```

Los specs de cada micro-app se guardan en la **raíz del proyecto**:

```
projects/store/store.spec.md
projects/bang-game/bang-game.spec.md
projects/secret-friend/secret-friend.spec.md
```

No implementes nada sin que exista un spec previo salvo instrucción explícita del usuario.

**Todo cambio de comportamiento, por pequeño que sea, DEBE reflejarse en el spec correspondiente antes de cerrar la tarea.** Si el cambio no tiene spec propio, actualiza el spec principal de la app (`<app>.spec.md`). Esto no es opcional.

## Skills disponibles

| Skill | Cuándo usarla |
|-------|--------------|
| `/sdd-init` | Inicializar SDD en el proyecto |
| `/sdd-explore` | Investigar una idea antes de proponer |
| `/sdd-ff` | Fast-forward: proposal → specs → design → tasks de una vez |
| `/sdd-apply` | Implementar tasks de un change |
| `/sdd-verify` | Validar implementación contra el spec |
| `/sdd-archive` | Cerrar un change completado |

## Convenciones de código

### Angular
- Angular 21.2, standalone components (sin `standalone: true` explícito)
- **Tailwind CSS v4** para todo el estilo — sin Angular Material
- No escribir CSS custom salvo casos excepcionales que Tailwind no cubra
- Estructura de carpetas por feature dentro de cada proyecto: `projects/<app>/src/app/<feature>/`
- Nombres de ficheros en kebab-case, clases en PascalCase

### Shared UI (`@shared/*`)
- Componentes y servicios reutilizables en `projects/shared/src/`
- Alias `@shared/*` disponible en todos los proyectos (definido en `tsconfig.json` raíz)
- Antes de crear un componente UI en una app, comprobar si ya existe en el shared
- Al añadir una app nueva que use el shared: `<app-toast-outlet />` en el root + `@source "../../shared/src"` en `styles.css`
- Ver `projects/shared/shared.spec.md` para API completa y convenciones

### General
- No añadir código sin que el usuario lo pida
- No refactorizar código ajeno a la tarea en curso
- No añadir comentarios salvo que la lógica no sea evidente

## Convenciones de Git

- Ramas por feature: `feature/nombre-feature`
- Commits en inglés, formato: `tipo: descripción corta`
- PRs siempre con issue asociado

## Memoria persistente

Este proyecto usa **Engram** para memoria entre sesiones. Guarda en memoria:
- Decisiones arquitecturales
- Bugs y su causa raíz
- Convenciones establecidas
- Descubrimientos no obvios del código

# AGENTS.md — Instrucciones para agentes IA

Lee este fichero antes de actuar en cualquier tarea de este proyecto.

## Contexto del proyecto

Lee `project.spec.md` para entender qué es el proyecto, el stack y la arquitectura acordada.

## Metodología: Spec-Driven Development (SDD)

Todo cambio relevante sigue el flujo SDD:

```
proposal → specs → design → tasks → apply → verify → archive
```

Los specs de cada feature/change se guardan **co-localizados con el código**:

```
src/app/games/bang-game/bang-game.spec.md
src/app/utilities/shuffle-friend/shuffle-friend.spec.md
```

No implementes nada sin que exista un spec previo salvo instrucción explícita del usuario.

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
- Angular 20, standalone components
- Angular Material para componentes UI (cards, botones, chips, iconos, formularios)
- **Tailwind CSS** para layout, espaciado y utilidades — preferido sobre CSS custom
- No escribir CSS custom salvo casos excepcionales que Material y Tailwind no cubran
- Estructura de carpetas por feature: `src/app/{games,utilities}/nombre-feature/`
- Nombres de ficheros en kebab-case, clases en PascalCase

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

# project.spec.md — RecursosUtiles

## Visión

Tienda de aplicaciones gratuitas, simples y de uso rápido. Cada herramienta es instalable como PWA independiente directamente desde el navegador, sin necesidad de instalar nada externo.

## Stack

### Frontend
- **Framework**: Angular 20
- **UI**: Angular Material
- **Lenguaje**: TypeScript 5.8
- **Comunicación en tiempo real**: SignalR (`@microsoft/signalr`)

### Backend
- **Framework**: .NET Core
- **Comunicación**: SignalR
- **Arquitectura**: Hexagonal con DDD

## Arquitectura acordada

### Multi-app PWA con subrutas

La aplicación principal actúa como tienda/directorio. Cada herramienta es una Angular app independiente con su propio `manifest.json` y service worker, desplegada en una subruta:

```
/              ← tienda principal (store)
/bang/         ← Bang Game (PWA instalable)
/shuffle/      ← Shuffle Friend (PWA instalable)
/chat/         ← Chat Manager (PWA instalable)
```

### Estructura de workspace (objetivo)

```
recursosUtiles/
  projects/
    store/           ← app principal (tienda)
    bang-game/       ← PWA independiente
    shuffle-friend/  ← PWA independiente
    chat-manager/    ← PWA independiente
  angular.json       ← workspace multi-proyecto
```

> La migración a workspace multi-proyecto es un cambio pendiente. Actualmente todo el código está en una única app Angular.

## Herramientas actuales

| Nombre | Ruta actual | Descripción | Backend |
|--------|-------------|-------------|---------|
| Bang Game | `src/app/games/bang-game/` | Juego de bang multijugador | Sí (SignalR) |
| Shuffle Friend | `src/app/utilities/shuffle-friend/` | Sorteador de personas | No |
| Chat Manager | `src/app/utilities/chat-manager/` | Chat en tiempo real | Sí (SignalR) |

## Estado actual del frontend

- HTML y CSS realizados manualmente, pendientes de revisar y refactorizar con Angular Material
- El botón "Instalar PWA" existe en la home pero sin lógica implementada
- No hay soporte PWA todavía (`@angular/pwa` no instalado)

## Specs de cambios

Cada cambio relevante tiene su spec co-localizado con el código afectado. Ver `AGENTS.md` para la convención completa.

---

> Para instrucciones dirigidas a agentes IA, ver `AGENTS.md`.

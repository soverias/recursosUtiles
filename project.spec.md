# project.spec.md — RecursosUtiles

## Visión

Tienda de aplicaciones gratuitas, simples y de uso rápido. Cada herramienta es instalable como PWA independiente directamente desde el navegador, sin necesidad de instalar nada externo.

## Stack

### Frontend
- **Framework**: Angular 20, standalone components
- **UI**: Tailwind CSS (sin Angular Material)
- **Lenguaje**: TypeScript 5.8
- **Comunicación en tiempo real**: SignalR (`@microsoft/signalr`) — solo en apps que lo requieran
- **Testing**: Karma + Jasmine (`ng test --project <nombre>`)

### Backend
- **Framework**: .NET Core
- **Comunicación**: SignalR
- **Arquitectura**: Hexagonal con DDD
- **Nota**: gestionado desde un repositorio independiente

## Arquitectura

### Workspace multi-proyecto Angular

```
recursosUtiles/
  projects/
    store/           ← tienda principal (PWA instalable)
    bang-game/       ← Bang Game (PWA instalable)
    shuffle-friend/  ← Shuffle Friend (PWA instalable)
  angular.json       ← workspace multi-proyecto
```

Cada proyecto tiene su propio:
- `manifest.webmanifest` y service worker (`@angular/pwa`)
- `styles.css` con `@import "tailwindcss"`
- `ngsw-config.json`

### Comandos por proyecto

```bash
ng serve --project store
ng serve --project bang-game
ng serve --project shuffle-friend

ng build --project store
ng test --project store
```

## Herramientas

| Nombre | Proyecto | Descripción | Backend |
|--------|----------|-------------|---------|
| Store | `store` | Tienda/directorio de herramientas | No |
| Bang Game | `bang-game` | Juego de bang multijugador | Sí (SignalR) |
| Shuffle Friend | `shuffle-friend` | Sorteador de personas | No |

## Specs de cambios

Cada cambio relevante tiene su spec co-localizado con el código afectado. Ver `AGENTS.md` para la convención completa.

---

> Para instrucciones dirigidas a agentes IA, ver `AGENTS.md`.

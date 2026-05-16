---
status: implemented
last_change: shared
last_verified: 2026-05-16
---

# shared — Librería UI compartida

## Propósito

Librería de componentes y servicios de UI reutilizables por todas las apps del workspace.
No es un paquete publicable — se consume directamente desde el código fuente mediante el alias `@shared/*`.

## Estructura

```
projects/shared/src/
  ui/
    toast/
      toast.service.ts       ← ToastService
      toast.component.ts     ← ToastOutletComponent
    index.ts                 ← barrel de exports de ui/
```

## Path alias

Definido en el `tsconfig.json` raíz (heredado por todos los proyectos):

```json
"paths": {
  "@shared/*": ["projects/shared/src/*"]
}
```

Uso en cualquier app:

```typescript
import { ToastService, ToastOutletComponent } from '@shared/ui';
```

## Tailwind — cómo incluir los estilos del shared

Tailwind v4 no escanea `projects/shared/` por defecto.
Cada app que use componentes del shared **debe** añadir en su `styles.css`:

```css
@import "tailwindcss";
@source "../../shared/src";
```

Sin esto, las clases de los componentes compartidos no aparecerán en el CSS generado.

---

## ToastService

**Import**: `import { ToastService } from '@shared/ui'`
**Providedín**: `root`

### API

```typescript
toast.show(message: string, type?: ToastType, durationMs?: number): void
toast.dismiss(id: number): void
toast.toasts: Signal<Toast[]>
```

### ToastType

```typescript
type ToastType = 'info' | 'success' | 'error' | 'warning'
```

### Colores por tipo

| Tipo | Clases Tailwind |
|------|----------------|
| `info` | `bg-gray-700 text-white` |
| `success` | `bg-green-600 text-white` |
| `error` | `bg-red-600 text-white` |
| `warning` | `bg-yellow-500 text-gray-900` |

### Comportamiento

- Auto-dismiss tras `durationMs` (por defecto 3500ms)
- Click sobre el toast lo descarta inmediatamente
- Múltiples toasts se apilan verticalmente

---

## ToastOutletComponent

**Selector**: `<app-toast-outlet />`
**Import**: `import { ToastOutletComponent } from '@shared/ui'`

Renderiza los toasts activos centrados en la parte superior de la pantalla (`fixed top-4`).
Se coloca **una sola vez** en el componente raíz de cada app:

```typescript
// app.ts
@Component({
  imports: [RouterOutlet, ToastOutletComponent],
  template: `
    <router-outlet />
    <app-toast-outlet />
  `,
})
export class App {}
```

---

## Cómo añadir una nueva app al shared

1. Añadir `<app-toast-outlet />` en el `app.ts` raíz de la app
2. Añadir `@source "../../shared/src"` en el `styles.css` de la app
3. Inyectar `ToastService` donde se necesite

---

## Convención para añadir nuevos componentes al shared

- Un componente por carpeta dentro de `ui/`
- Exportar desde `ui/index.ts`
- Solo entran componentes/servicios que se vayan a usar en **al menos dos apps**
- Sin dependencias externas (solo Angular + Tailwind)

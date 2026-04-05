# Spec: store

**Change**: store  
**Version**: 1.0  
**Date**: 2026-04-04  
**Status**: implemented  

---

## 1. Contexto y alcance

La app `store` es el directorio principal de RecursosUtiles. Muestra un catálogo de herramientas gratuitas instalables como PWA y permite al usuario instalar la propia Store como PWA desde el navegador.

**Fuera de alcance (v1.0):**
- Búsqueda o filtrado de herramientas
- Backend — el catálogo es estático
- Autenticación

---

## 2. Modelo de datos

### Tool
```ts
interface Tool {
  id: string;          // identificador único, kebab-case
  name: string;        // nombre para mostrar
  description: string; // descripción corta
  category: string;    // categoría (ej: 'games', 'utilities')
  icon: string;        // emoji o carácter visual
  url: string;         // URL de la herramienta; '#' si no disponible aún
  color: string;       // color hex de la herramienta (acento visual)
}
```

**Datos iniciales (`tools.data.ts`):**
- Bang Game — `games`, `#b91c1c`
- Shuffle Friend — `utilities`, `#0369a1`

---

## 3. Componentes

### 3.1 AppComponent (shell)

**Selector**: `app-root`  
**Fichero**: `app.ts` / `app.html`

**Comportamiento:**
- Renderiza `<app-header>` en la parte superior
- Renderiza `<router-outlet>` para el contenido de cada ruta

**Escenarios:**
- APP-01: renderiza `app-header`
- APP-02: renderiza `router-outlet`

---

### 3.2 HeaderComponent

**Selector**: `app-header`  
**Fichero**: `components/header/`

**Comportamiento:**
- Muestra el nombre de la app ("Store")
- Muestra un botón "Instalar App" **solo si** `PwaInstallService.canInstall` es `true`
- Al hacer clic en el botón llama a `PwaInstallService.promptInstall()`

**Escenarios:**
- HDR-01: el botón de instalación NO es visible cuando `canInstall` es `false`
- HDR-02: el botón de instalación SÍ es visible cuando `canInstall` es `true`, con texto "Instalar"
- HDR-03: al hacer clic en el botón se llama a `promptInstall()`
- HDR-04: muestra el nombre "Store"

---

### 3.3 HomeComponent

**Selector**: `app-home`  
**Fichero**: `components/home/`  
**Ruta**: `/`

**Comportamiento:**
- Renderiza un `<app-card>` por cada herramienta del catálogo (`TOOLS`)
- El grid es responsive: 1 columna en móvil, 2 en md, 3 en lg
- Si el catálogo está vacío muestra un mensaje "No hay herramientas disponibles"

**Escenarios:**
- HOME-01: renderiza tantas `app-card` como herramientas hay en `TOOLS`
- HOME-01 triangulate: `TOOLS` tiene al menos 2 herramientas
- HOME-02: el contenedor grid tiene las clases `grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3`

---

### 3.4 AppCardComponent

**Selector**: `app-card`  
**Fichero**: `components/app-card/`  
**Input**: `tool: Tool` (required)

**Comportamiento:**
- Renderiza el nombre de la herramienta
- Renderiza la descripción de la herramienta
- El enlace apunta a `tool.url`, se abre en nueva pestaña con `rel="noopener noreferrer"`
- Muestra el icono con fondo de color `tool.color` al 12% de opacidad (`color + '20'`)
- Al hover muestra una barra inferior del color de la herramienta (animada de 0 a full width)
- El color de acento se aplica vía CSS custom property `--card-color` en el host

**Escenarios:**
- CARD-01: renderiza el nombre de la herramienta
- CARD-01 triangulate: renderiza correctamente con una herramienta diferente
- CARD-02: renderiza la descripción de la herramienta
- CARD-03: el enlace apunta a `tool.url`
- CARD-03 triangulate: el enlace apunta a la URL de otra herramienta
- CARD-04: el enlace tiene `target="_blank"` y `rel` contiene `noopener`

---

## 4. Servicios

### 4.1 PwaInstallService

**Fichero**: `services/pwa-install.service.ts`  
**Scope**: `providedIn: 'root'`

**Comportamiento:**
- Captura el evento `beforeinstallprompt` del navegador y almacena la referencia (cancela el comportamiento por defecto)
- Expone `canInstall: Signal<boolean>` — `true` si hay un prompt capturado pendiente
- `promptInstall()` — llama a `prompt()` en el evento capturado y limpia la referencia; no-op si no hay prompt
- Limpia el listener al destruirse (`DestroyRef`)

**Escenarios:**
- PWA-01: `canInstall` es `false` por defecto
- PWA-02: `canInstall` pasa a `true` tras disparar `beforeinstallprompt`
- PWA-03: `promptInstall()` llama a `prompt()` sobre el evento capturado
- PWA-04: `promptInstall()` es un no-op cuando `canInstall` es `false`
- PWA-05: `canInstall` vuelve a `false` tras resolver `promptInstall()`

---

## 5. Routing

| Ruta | Componente | Carga |
|------|-----------|-------|
| `/` | HomeComponent | lazy |
| `**` | — | redirect a `/` |

---

## 6. Convenciones técnicas

- Todos los componentes: standalone, `ChangeDetectionStrategy.OnPush`
- Estado reactivo: `signal()`, `computed()`, `input.required()`
- Estilos: Tailwind CSS únicamente — sin CSS custom salvo casos excepcionales
- Tests: Vitest (`vi.fn()`, `toHaveBeenCalledOnce()`)
- Ficheros: kebab-case; clases: PascalCase

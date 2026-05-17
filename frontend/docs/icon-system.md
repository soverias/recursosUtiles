# Icon system — referencia de diseño

Patrón unificado de iconos PWA del catálogo recursosUtiles. Léelo solo cuando vayas a crear o modificar iconos de una app.

## Principio

Toda app del monorepo comparte un **lenguaje visual común** y varía solo dos cosas: **color de marca** y **glifo**. El frame, el padding, el shape, el highlight y la safe-zone son inmutables. Esto da identidad de catálogo y hace reconocibles las apps como "familia".

## Lenguaje compartido

| Elemento | Valor fijo |
|---|---|
| Lienzo | `viewBox="0 0 512 512"` |
| Shape del tile | `rect` 512×512 con `rx="113" ry="113"` (radio del 22%, squircle iOS-like) |
| Highlight superior | `rect` 512×256 con `rx="113" ry="113"`, `fill="#ffffff"`, `opacity="0.07"` |
| Caja del glifo | 300×300 centrada en (256, 256) → top-left en (106, 106), bottom-right en (406, 406) |
| Safe-zone maskable | Círculo interior del 80% (~410 px de diámetro) — el glifo MUST caber dentro |
| Color del glifo | Blanco puro `#ffffff` por defecto. Variaciones permitidas: crema `#fef3c7`, `#f1ead8`, `#fcd34d`, `#d6cba8` cuando se necesite sombreado 3D |
| Color del pip/detalle oscuro | `#2a1c08` (marrón cálido) o un tono oscuro del color de marca |

## Anatomía del SVG maestro

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- 1. Tile: color de marca de la app, full-bleed -->
  <rect width="512" height="512" rx="113" ry="113" fill="<APP_COLOR>"/>

  <!-- 2. Highlight superior (CONSTANTE — no tocar) -->
  <rect width="512" height="256" rx="113" ry="113" fill="#ffffff" opacity="0.07"/>

  <!-- 3. Glifo específico de la app (dentro de la caja 300×300 centrada) -->
  <g>
    <!-- ... shapes del glifo en blanco ... -->
  </g>
</svg>
```

**Restricción de peso**: el SVG maestro DEBE pesar **<2 KB**. Los actuales pesan entre 360 y 1100 bytes — si te pasas, simplifica.

## Cómo crear el icono de una app nueva

1. Diseña el SVG maestro siguiendo la plantilla anterior y guárdalo en:
   ```
   frontend/projects/<app>/public/icons/source.svg
   ```
2. Ejecuta desde `frontend/`:
   ```bash
   npm run icons
   ```
3. El script genera automáticamente los 8 PNG (72, 96, 128, 144, 152, 192, 384, 512) en `frontend/projects/<app>/public/icons/`.
4. Verifica visualmente:
   - `icon-512x512.png` debe verse limpio y rico en detalle.
   - `icon-72x72.png` debe seguir siendo identificable como el glifo (test de legibilidad a tamaño pequeño).
5. Si el glifo se pierde a 72×72, simplifica: menos detalle, trazos más gruesos, formas más sólidas.

## Pipeline

- Script: `frontend/scripts/generate-icons.mjs`
- Dep: `sharp` (devDependency)
- Trigger: manual con `npm run icons`. **No se integra en `build`** — los PNG viven commiteados.
- Idempotente: re-ejecutar sin cambios en `source.svg` produce bytes idénticos.
- Itera todos los `projects/*/public/icons/source.svg`; salta los que no existen.

## Reglas de diseño del glifo

- **Silueta sólida** (fill), no outline. Los strokes finos desaparecen a 72×72.
- **Formas geométricas básicas**: círculos, rects, paths sencillos. Cero ilustraciones realistas.
- **Reconocible a 72×72**: si el glifo no se entiende a ese tamaño, replantea.
- **Padding respetuoso**: el glifo NO debe tocar los bordes de la caja 300×300 — deja ~20 px de respiro mínimo.
- **Sin gradientes complejos**: solo el highlight superior plano. Sombreado 3D opcional con 2-3 shades planos (ver `random-generator/source.svg` — dado isométrico con 3 caras).
- **Sin texto**: las letras a 72×72 son ilegibles. Usa símbolos.
- **Ribbon de contraste**: cuando una forma necesita "atravesar" otra (ej. cintas del regalo de secret-friend), usar el color del tile sustractivamente o el color de marca para que se diferencie.

## Glifos actuales (referencia visual)

| App | Tile | Glifo | Cómo se construye |
|---|---|---|---|
| **bang-game** | `#b91c1c` | Diana concéntrica | 2 `circle` con `stroke="#ffffff"` + bullseye `circle` sólido |
| **calculator** | `#0d9488` | Grid 2×2 de botones | 4 `rect` con `rx="22"`; uno en crema `#f1ead8` (acento "=") |
| **password-generator** | `#8b5cf6` | Candado | `path` con `stroke` para el shackle U + `rect` para body + `circle`+`rect` sustractivos para keyhole |
| **qr-generator** | `#0ea5e9` | 3 finder patterns | 3 stacks de `rect` (blanco/tile/blanco) en las 3 esquinas |
| **random-generator** | `#f59e0b` | Dado isométrico | 3 `path` con caras shaded (#ffffff, #f1ead8, #d6cba8) + `ellipse` para el pip |
| **secret-friend** | `#6366f1` | Caja regalo | `rect` body + `rect` cintas color tile + `ellipse` para el bow |

Para inspirarte o copiar estructura, abre directamente los `source.svg` correspondientes.

## Decisiones rechazadas (registro)

- ❌ **Emoji rasterizado**: cada SO renderiza el emoji con su propia font — incoherente.
- ❌ **Glifos con stroke fino**: ilegibles a 72×72.
- ❌ **Gradientes en el tile**: el sólido lee mejor en thumbnails.
- ❌ **Generación en build time**: añade un step al CI/CD y compromete reproducibilidad. Mejor commitear PNG.
- ❌ **`pwa-asset-generator`** (Puppeteer + Chromium, ~300MB): pesado para un caso trivial. `sharp` es la opción mínima.

## Casos especiales

- **bang-game** ha quedado con `theme_color`, `background_color`, `short_name` y `description` añadidos a su `manifest.webmanifest` durante este change. Si vas a añadir una app nueva, asegúrate de que su manifest tiene los 9 campos: `name`, `short_name`, `description`, `display`, `background_color`, `theme_color`, `scope`, `start_url`, `icons`.
- **secret-friend** tiene `background_color: "#ffffff"` (splash blanco). Esto NO afecta al icono — el tile del icono usa su color de marca `#6366f1` igualmente. Marca ≠ splash screen color.

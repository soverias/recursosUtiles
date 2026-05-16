# Proposal: Calculator + Unit Converter

**Change**: calculator  
**Version**: 0.1  
**Date**: 2026-04-08  
**Status**: proposed  

---

## 1. Intent

Crear una nueva micro-app PWA en el workspace RecursosUtiles que combine una calculadora aritmética convencional con un conversor de unidades. La propuesta de valor es que el usuario pueda mezclar unidades dentro de expresiones aritméticas (ej: `2 GB + 500 MB`) y obtener resultados convertidos automáticamente, además de poder usar la calculadora como calculadora numérica pura.

**Por qué**: No existe ninguna herramienta en el catálogo que cubra cálculo numérico ni conversión de unidades. Es una utilidad de uso frecuente, 100% offline, y encaja perfectamente como PWA independiente.

---

## 2. Scope

### Incluido (v1.0)

- Calculadora aritmética básica: `+`, `-`, `*`, `/`, paréntesis
- Conversión de unidades integrada en expresiones
- 6 categorías de unidades:
  - **Data**: TB, GB, MB, KB, B
  - **Weight**: kg, g, lb, oz
  - **Volume**: L, mL, gal, floz
  - **Length**: km, m, cm, mm, in, ft, mi
  - **Temperature**: °C, °F, K
  - **Numeric** (sin unidades): modo calculadora pura
- Selector de unidad de salida para el resultado
- Historial de cálculos en memoria (signal, no persistido)
- PWA offline: service worker, manifest, instalable
- UI responsive, mobile-first, Tailwind CSS v4
- Cada componente con su `<component>.spec.md`

### Excluido (v1.0)

- Backend o API externa
- Persistencia entre sesiones (localStorage — v2)
- Categorías adicionales (tiempo, velocidad, área, etc.)
- Modo científico (trigonometría, logaritmos, etc.)
- i18n — la UI será en castellano

---

## 3. Approach: High-Level Architecture

### 3.1 Project Structure

```
projects/calculator/
  calculator.proposal.md
  calculator.spec.md
  calculator.design.md
  calculator.tasks.md
  ngsw-config.json
  tsconfig.app.json
  tsconfig.spec.json
  public/
    favicon.ico
    manifest.webmanifest
    icons/
  src/
    index.html
    main.ts
    styles.css
    app/
      app.ts
      app.html
      app.config.ts
      app.routes.ts
      app.spec.ts
      core/
        models/
          unit.model.ts
          expression.model.ts
        engine/
          tokenizer.ts
          tokenizer.spec.ts
          parser.ts
          parser.spec.ts
          evaluator.ts
          evaluator.spec.ts
          conversion.ts
          conversion.spec.ts
        services/
          calculator.service.ts
          calculator.service.spec.ts
          history.service.ts
          history.service.spec.ts
      components/
        display/
          display.component.ts
          display.component.spec.ts
          display.spec.md
        keypad/
          keypad.component.ts
          keypad.component.spec.ts
          keypad.spec.md
        unit-selector/
          unit-selector.component.ts
          unit-selector.component.spec.ts
          unit-selector.spec.md
        history-panel/
          history-panel.component.ts
          history-panel.component.spec.ts
          history-panel.spec.md
        header/
          header.component.ts
          header.component.spec.ts
          header.spec.md
```

### 3.2 Key Design Decisions

1. **Expression engine como funciones puras**: tokenizer, parser y evaluator son funciones puras sin dependencias Angular. Máxima testeabilidad con Vitest.

2. **Pipeline de 3 fases**: `string → Token[] → AST → Result`. Cada fase testeable e independiente.

3. **Units como tokens de primera clase**: el tokenizer reconoce sufijos de unidad. `2 GB` → `{ type: 'value', amount: 2, unit: 'GB' }`.

4. **Conversión en tiempo de evaluación**: cuando el evaluator encuentra operación entre unidades compatibles, convierte ambas a unidad base, opera y convierte al output unit seleccionado.

5. **Estado con Signals**: `CalculatorService` expone `expression: signal<string>`, `result: computed<Result>`, `outputUnit: signal<Unit | null>`, `error: computed<string | null>`.

6. **Shared library**: `<app-toast-outlet />` + `ToastService` de `@shared/ui` para feedback de errores.

---

## 4. Components & Pages

App de una sola página (sin routing complejo más allá de `/`).

| Componente | Responsabilidad |
|------------|----------------|
| App (shell) | Layout principal, incluye toast outlet |
| HeaderComponent | Título + botón de instalación PWA |
| DisplayComponent | Muestra expresión actual y resultado con unidad |
| KeypadComponent | Grid de botones: dígitos, operadores, unidades rápidas |
| UnitSelectorComponent | Selector de categoría activa y unidad de salida |
| HistoryPanelComponent | Panel colapsable con historial de cálculos |

---

## 5. Conversion Engine

### 5.1 Unit Model

```ts
type UnitCategory = 'data' | 'weight' | 'volume' | 'length' | 'temperature' | 'numeric';

interface UnitDefinition {
  symbol: string;
  name: string;
  category: UnitCategory;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}
```

Funciones `toBase`/`fromBase` en lugar de multiplicadores simples para soportar temperatura (conversión no lineal).

### 5.2 Base Units

| Categoría   | Unidad base |
|-------------|-------------|
| Data        | B (bytes)   |
| Weight      | g           |
| Volume      | mL          |
| Length      | mm          |
| Temperature | K           |
| Numeric     | —           |

### 5.3 Reglas de evaluación

- **Misma unidad / ambos sin unidad**: operar directamente
- **Misma categoría, distinta unidad**: convertir a base, operar, convertir a output unit
- **Categorías distintas**: error "No se puede operar GB con kg"
- **Uno con unidad, otro sin ella**: el sin unidad adopta la unidad del otro (`2 GB * 3` = `6 GB`)

### 5.4 Temperatura

Tratamiento pragmático: operaciones directas sobre valores con conversión vía Kelvin como base. `20 °C + 5 °C` = `25 °C`.

---

## 6. PWA Setup

Sigue el mismo patrón que `store`, `bang-game` y `secret-friend`:
- `manifest.webmanifest` con `display: standalone`, tema oscuro
- `ngsw-config.json` con prefetch de app shell
- `provideServiceWorker()` en `app.config.ts` con `registerWhenStable:30000`
- Actualizar `angular.json` con el nuevo proyecto `calculator`
- Actualizar `tsconfig.json` raíz con referencias del nuevo proyecto
- Añadir entrada en el catálogo de la store

---

## 7. Risks & Open Questions

### Riesgos

1. **Complejidad del parser**: mezclar unidades en expresiones requiere gramática bien definida y TDD exhaustivo.
2. **Semántica de temperatura**: se documenta el enfoque pragmático (suma directa).
3. **Ambigüedad de símbolos**: `m` podría ser metros o mili. Usar tabla de símbolos estricta y sin ambigüedades.
4. **`fl oz`**: símbolo con espacio complica tokenizer. Se usa `floz` como token, `fl oz` solo en UI.

### Preguntas abiertas

1. ¿Teclado físico (keyboard shortcuts) en v1 o v2? → Propuesto: v2.
2. ¿Persistencia en localStorage? → v2.
3. ¿Actualizar el catálogo de la store en el mismo change? → Sí.

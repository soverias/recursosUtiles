# Design: Calculator + Unit Converter

**Change**: calculator  
**Version**: 0.1  
**Date**: 2026-04-08  
**Status**: designed  

---

## 1. Architecture Decisions

### 1.1 Final Folder Structure

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
      icon-72x72.png ... icon-512x512.png
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
          tokenizer.ts + tokenizer.spec.ts
          parser.ts + parser.spec.ts
          evaluator.ts + evaluator.spec.ts
          conversion.ts + conversion.spec.ts
        services/
          calculator.service.ts + calculator.service.spec.ts
          history.service.ts + history.service.spec.ts
      components/
        display/       display.component.ts|spec.ts|spec.md
        keypad/        keypad.component.ts|spec.ts|spec.md
        unit-selector/ unit-selector.component.ts|spec.ts|spec.md
        history-panel/ history-panel.component.ts|spec.ts|spec.md
        header/        header.component.ts|spec.ts|spec.md
```

### 1.2 Key Architecture Decisions

| Decisión | Elección | Alternativa descartada | Motivo |
|----------|----------|------------------------|--------|
| Expression engine | Funciones puras (sin deps Angular) | Service-only | Máxima testeabilidad con Vitest puro, sin TestBed |
| Pipeline | `string → Token[] → AST → EvalResult` | Single-pass eval | Cada fase testeable e independiente; errores con posición |
| Estado | Angular Signals (`signal()`, `computed()`) | RxJS / NgRx | Convención del workspace; sincrónico |
| Modelo de conversión | `toBase`/`fromBase` por unidad | Tabla de factores | Soporta temperatura (no lineal) sin casos especiales |
| Temperatura | Aritmética directa, Kelvin como base con delta handling | Prohibir aritmética de temperatura | Pragmático: el usuario espera `20 °C + 5 °C = 25 °C` |
| Historial | Signal en memoria (no persistido) | localStorage | v1 scope |
| Feedback de errores | `@shared/ui` ToastService + display inline | Solo toast | Consistente con workspace |

### 1.3 Pipeline del Expression Engine

```
Input string
     │
     ▼
┌───────────┐
│ Tokenizer │  tokenize(input: string): Token[]
└───────────┘
     │
     ▼
┌────────┐
│ Parser │  parse(tokens: Token[]): ExpressionNode
└────────┘
     │
     ▼
┌───────────┐
│ Evaluator │  evaluate(ast: ExpressionNode, outputUnit?): EvalResult
└───────────┘
     │
     ▼
EvalResult { value, unit, formatted }
```

Cada fase es una función pura exportada en su propio fichero. Sin clases, sin estado. `CalculatorService` orquesta el pipeline.

### 1.4 Flujo de Signals

```
KeypadComponent          CalculatorService          DisplayComponent
    │                          │                          │
    ├─ keyPress output ────────►│                          │
    │                          ├─ expression signal        │
    │                          ├─ computed result          │
    │                          │   (tokenize→parse→eval)  │
    │                          │                          │
UnitSelectorComponent          │◄─ reads expression() ────┤
    │                          │◄─ reads result() ─────────┤
    ├─ categoryChange ─────────►│◄─ reads error() ──────────┤
    └─ outputUnitChange ───────►│
```

### 1.5 CalculatorService

`providedIn: 'root'`. Estado y métodos:

```typescript
// Signals de estado
expression = signal<string>('')
activeCategory = signal<UnitCategory>('numeric')
outputUnit = signal<UnitDefinition | null>(null)

// Computeds derivados
result = computed<EvalResult | null>(() => { /* pipeline con try/catch */ })
error = computed<string | null>(() => { /* mensaje de error si pipeline falla */ })
quickUnits = computed<UnitDefinition[]>(() => unitsForCategory(activeCategory()))

// Métodos
appendToExpression(value: string): void
clearExpression(): void       // C
deleteLast(): void            // ⌫
calculate(): void             // = → guarda en historial
setCategory(cat: UnitCategory): void
setOutputUnit(unit: UnitDefinition | null): void
loadExpression(expr: string): void  // desde historial
```

### 1.6 HistoryService

```typescript
entries = signal<HistoryEntry[]>([])   // más reciente primero
addEntry(entry: HistoryEntry): void    // prepend
clearHistory(): void
```

---

## 2. TypeScript Interfaces & Types

### 2.1 `unit.model.ts`

```typescript
export type UnitCategory = 'data' | 'weight' | 'volume' | 'length' | 'temperature' | 'numeric';

export interface UnitDefinition {
  readonly symbol: string;
  readonly name: string;
  readonly category: UnitCategory;
  readonly toBase: (value: number) => number;
  readonly fromBase: (value: number) => number;
}

export interface UnitCategoryMeta {
  readonly category: UnitCategory;
  readonly label: string;               // 'Datos', 'Peso', etc.
  readonly baseUnit: string;
  readonly units: readonly UnitDefinition[];
}
```

### 2.2 `expression.model.ts`

```typescript
export type TokenType =
  | 'NUMBER' | 'UNIT' | 'OPERATOR' | 'PAREN_OPEN' | 'PAREN_CLOSE' | 'EOF';

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
}

export type ExpressionNode = BinaryOpNode | UnaryMinusNode | ValueNode;

export interface BinaryOpNode {
  readonly kind: 'binary';
  readonly operator: '+' | '-' | '*' | '/';
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

export interface UnaryMinusNode {
  readonly kind: 'unary_minus';
  readonly operand: ExpressionNode;
}

export interface ValueNode {
  readonly kind: 'value';
  readonly amount: number;
  readonly unit: UnitDefinition | null;
}

export interface EvalResult {
  readonly value: number;
  readonly unit: UnitDefinition | null;
  readonly formatted: string;
}

export interface HistoryEntry {
  readonly id: number;
  readonly expression: string;
  readonly result: EvalResult;
  readonly timestamp: number;
}
```

### 2.3 Tabla de Conversiones

**Data** (base: B)

| Símbolo | toBase | fromBase |
|---------|--------|----------|
| B | `v => v` | `v => v` |
| KB | `v => v * 1024` | `v => v / 1024` |
| MB | `v => v * 1024**2` | `v => v / 1024**2` |
| GB | `v => v * 1024**3` | `v => v / 1024**3` |
| TB | `v => v * 1024**4` | `v => v / 1024**4` |

**Weight** (base: g)

| Símbolo | toBase | fromBase |
|---------|--------|----------|
| g | `v => v` | `v => v` |
| kg | `v => v * 1000` | `v => v / 1000` |
| lb | `v => v * 453.592` | `v => v / 453.592` |
| oz | `v => v * 28.3495` | `v => v / 28.3495` |

**Volume** (base: mL)

| Símbolo | toBase | fromBase |
|---------|--------|----------|
| mL | `v => v` | `v => v` |
| L | `v => v * 1000` | `v => v / 1000` |
| gal | `v => v * 3785.41` | `v => v / 3785.41` |
| floz | `v => v * 29.5735` | `v => v / 29.5735` |

**Length** (base: mm)

| Símbolo | toBase | fromBase |
|---------|--------|----------|
| mm | `v => v` | `v => v` |
| cm | `v => v * 10` | `v => v / 10` |
| m | `v => v * 1000` | `v => v / 1000` |
| km | `v => v * 1_000_000` | `v => v / 1_000_000` |
| in | `v => v * 25.4` | `v => v / 25.4` |
| ft | `v => v * 304.8` | `v => v / 304.8` |
| mi | `v => v * 1_609_344` | `v => v / 1_609_344` |

**Temperature** (base: K)

| Símbolo | toBase | fromBase |
|---------|--------|----------|
| K | `v => v` | `v => v` |
| C | `v => v + 273.15` | `v => v - 273.15` |
| F | `v => (v - 32) * 5/9 + 273.15` | `v => (v - 273.15) * 9/5 + 32` |

> Nota: `°C` y `°F` aceptados en UI; el tokenizer también acepta `C` y `F`.

---

## 3. Component API (Inputs / Outputs)

### 3.1 App (shell)

```typescript
// Inyecta CalculatorService y HistoryService
// Orquesta todos los componentes hijo
// No tiene inputs/outputs (es el root)
```

### 3.2 HeaderComponent

```typescript
// Sin inputs/outputs
// Muestra título + botón de instalación PWA
```

### 3.3 DisplayComponent

```typescript
readonly expression = input.required<string>();
readonly result     = input<EvalResult | null>(null);
readonly error      = input<string | null>(null);
// Sin outputs — solo presentacional
```

### 3.4 KeypadComponent

```typescript
readonly quickUnits = input<UnitDefinition[]>([]);
readonly keyPress   = output<string>();
// Emite: '0'-'9', '.', '+', '-', '*', '/', '(', ')', 'C', '⌫', '=', símbolos de unidad
```

### 3.5 UnitSelectorComponent

```typescript
readonly categories    = input.required<readonly UnitCategoryMeta[]>();
readonly activeCategory = input.required<UnitCategory>();
readonly outputUnit     = input<UnitDefinition | null>(null);

readonly categoryChange    = output<UnitCategory>();
readonly outputUnitChange  = output<UnitDefinition | null>();
```

### 3.6 HistoryPanelComponent

```typescript
readonly entries       = input.required<readonly HistoryEntry[]>();
readonly entrySelected = output<HistoryEntry>();
readonly clearHistory  = output<void>();

readonly isExpanded = signal(false);  // estado interno
```

---

## 4. Gramática de Expresiones (EBNF)

```ebnf
expression  ::= term ( ('+' | '-') term )*
term        ::= factor ( ('*' | '/') factor )*
factor      ::= '-' primary | primary
primary     ::= '(' expression ')' | value
value       ::= NUMBER UNIT?

NUMBER      ::= DIGIT+ ('.' DIGIT+)?
UNIT        ::= 'TB' | 'GB' | 'MB' | 'KB' | 'B'
              | 'kg' | 'g' | 'lb' | 'oz'
              | 'L' | 'mL' | 'gal' | 'floz'
              | 'km' | 'm' | 'cm' | 'mm' | 'in' | 'ft' | 'mi'
              | '°C' | '°F' | 'K' | 'C' | 'F'
```

**Reglas del tokenizer**:
1. Whitespace ignorado (consumido, no emitido)
2. Numbers: greedy, máximo un punto decimal
3. Tras NUMBER: longest-match lookup para UNIT
4. Operadores y paréntesis emiten sus tokens correspondientes
5. Carácter no reconocido → error con posición

**Reglas del evaluator para unidades**:
- Ambos null → operar directamente
- Misma unidad → operar directamente
- Misma categoría, distinta unidad → convertir a base, operar, convertir a outputUnit
- Distinta categoría → error `"No se puede operar {A} con {B}"`
- Uno con unidad, otro sin → el sin unidad adopta la unidad del otro
- `*` o `/` con ambos operandos con unidad → error `"La multiplicación/división requiere al menos un operando numérico"`
- **Temperatura (delta)**: en `+`/`-` entre temperaturas, el operando derecho se trata como delta (offset), no temperatura absoluta, para que `20 C + 5 C = 25 C`

---

## 5. PWA & Workspace Setup

### 5.1 `angular.json` — bloque a añadir en `"projects"`

```json
"calculator": {
  "projectType": "application",
  "root": "projects/calculator",
  "sourceRoot": "projects/calculator/src",
  "prefix": "app",
  "architect": {
    "build": {
      "builder": "@angular/build:application",
      "options": {
        "browser": "projects/calculator/src/main.ts",
        "tsConfig": "projects/calculator/tsconfig.app.json",
        "assets": [{ "glob": "**/*", "input": "projects/calculator/public" }],
        "styles": ["projects/calculator/src/styles.css"]
      },
      "configurations": {
        "production": {
          "budgets": [
            { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
            { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
          ],
          "outputHashing": "all",
          "serviceWorker": "projects/calculator/ngsw-config.json"
        },
        "development": { "optimization": false, "extractLicenses": false, "sourceMap": true }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "builder": "@angular/build:dev-server",
      "configurations": {
        "production": { "buildTarget": "calculator:build:production" },
        "development": { "buildTarget": "calculator:build:development" }
      },
      "defaultConfiguration": "development"
    },
    "test": { "builder": "@angular/build:unit-test" }
  }
}
```

### 5.2 `tsconfig.json` — referencias a añadir

```json
{ "path": "./projects/calculator/tsconfig.app.json" },
{ "path": "./projects/calculator/tsconfig.spec.json" }
```

### 5.3 `tsconfig.app.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "../../out-tsc/app", "types": [] },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

### 5.4 `tsconfig.spec.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "../../out-tsc/spec", "types": ["vitest/globals"] },
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
}
```

### 5.5 `manifest.webmanifest`

```json
{
  "name": "Calculadora",
  "short_name": "Calculadora",
  "description": "Calculadora con conversor de unidades integrado",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#16213e",
  "scope": "./",
  "start_url": "./",
  "icons": [
    { "src": "icons/icon-72x72.png",   "sizes": "72x72",   "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-96x96.png",   "sizes": "96x96",   "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-128x128.png", "sizes": "128x128", "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-144x144.png", "sizes": "144x144", "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-152x152.png", "sizes": "152x152", "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-384x384.png", "sizes": "384x384", "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ]
}
```

### 5.6 `ngsw-config.json`

```json
{
  "$schema": "../../node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.csr.html", "/index.html", "/manifest.webmanifest", "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/**/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"]
      }
    }
  ]
}
```

### 5.7 `styles.css`

```css
@import "tailwindcss";
@source "../../shared/src";
```

### 5.8 `app.config.ts`

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

---

## 6. UI Layout (Tailwind)

### 6.1 Layout General

```
┌──────────────────────────────┐
│  HEADER — título + install   │  bg-gray-900, sticky top
├──────────────────────────────┤
│  DISPLAY                     │  bg-gray-800, p-4
│  expresión (right-align)     │  text-gray-400 text-sm
│  resultado (right-align)     │  text-white text-3xl font-bold
│  error (right-align, red)    │  text-red-400
├──────────────────────────────┤
│  UNIT SELECTOR               │  bg-gray-900, px-3 py-2
│  pills categoría (scroll H)  │
│  dropdown output unit        │
├──────────────────────────────┤
│  KEYPAD                      │  grid grid-cols-4 gap-2 p-3
│  [C]  [( )]  [⌫]  [/]       │  botones h-14, rounded-xl
│  [7]  [8]   [9]   [*]       │
│  [4]  [5]   [6]   [-]       │
│  [1]  [2]   [3]   [+]       │
│  [0]  [.]   [U]   [=]       │
│  fila units rápidas (scroll) │  bg-teal-700
├──────────────────────────────┤
│  HISTORY (colapsable)        │
│  "Historial (N)" toggle      │
│  lista entries + "Limpiar"   │
└──────────────────────────────┘
```

### 6.2 Colores de Botones

| Tipo | Clases Tailwind |
|------|-----------------|
| Dígitos | `bg-gray-700 text-white` |
| Operadores | `bg-indigo-600 text-white` |
| Igual | `bg-amber-500 text-gray-900 font-bold` |
| Clear/Backspace | `bg-red-700/60 text-white` |
| Paréntesis | `bg-gray-600 text-white` |
| Unidades rápidas | `bg-teal-700 text-white` |

### 6.3 Responsividad

- Default: full width, `p-2`
- `sm (≥640px)`: `max-w-md mx-auto`
- `md (≥768px)`: `max-w-lg mx-auto`

---

## 7. Edge Cases & Error Handling

| Caso | Comportamiento |
|------|----------------|
| División por cero | Error: `"División por cero"` |
| Expresión vacía | Sin resultado, sin error; `=` no hace nada |
| Unidades incompatibles | Error: `"No se puede operar {A} con {B}"` |
| `*`/`/` entre dos unidades | Error: `"La multiplicación/división requiere al menos un operando numérico"` |
| Resultado `Infinity` | Error: `"Resultado demasiado grande"` |
| Resultado `NaN` | Error: `"Resultado inválido"` |
| Paréntesis sin cerrar | Error con posición: `"Se esperaba ')' en posición {N}"` |
| Operador al final | Error: `"Se esperaba un valor después de '{op}'"` |
| Símbolo de unidad desconocido | Error: `"Unidad desconocida: '{sym}' en posición {N}"` |
| Temperatura: `20 C + 5 C` | Resultado: `25 C` (right operand tratado como delta) |

### Formato de resultados

`Intl.NumberFormat('es-ES')` con máximo 10 dígitos significativos.

---

## 8. Testing Strategy

| Capa | Herramienta | Notas |
|------|-------------|-------|
| Engine (tokenizer, parser, evaluator, conversion) | Vitest puro | Sin TestBed, máxima velocidad |
| Services (CalculatorService, HistoryService) | Vitest + TestBed | `inject()` en test environment |
| Components | Vitest + TestBed + Angular testing | `ComponentFixture`, `@testing-library/angular` si disponible |

---

## 9. Ficheros a Crear/Modificar

| Fichero | Acción |
|---------|--------|
| `angular.json` | Modificar — añadir proyecto `calculator` |
| `tsconfig.json` | Modificar — añadir referencias |
| `projects/calculator/**` | Crear — toda la estructura nueva |
| `projects/store/src/app/data/tools.data.ts` | Modificar — añadir entrada calculator al catálogo |

# Tasks: Calculator + Unit Converter

**Change**: calculator  
**Version**: 0.1  
**Date**: 2026-04-08  

---

## Phase 0: Workspace setup

- [x] Añadir proyecto `calculator` en `angular.json` (ver bloque exacto en `calculator.design.md` §5.1)
- [x] Añadir referencias en `tsconfig.json` raíz: `calculator/tsconfig.app.json` y `calculator/tsconfig.spec.json`
- [x] Crear `projects/calculator/tsconfig.app.json`
- [x] Crear `projects/calculator/tsconfig.spec.json`
- [x] Crear `projects/calculator/src/index.html` (shell HTML, título "Calculadora")
- [x] Crear `projects/calculator/src/main.ts` (bootstrap con `appConfig`)
- [x] Crear `projects/calculator/src/styles.css` (`@import "tailwindcss"; @source "../../shared/src";`)
- [x] Crear `projects/calculator/src/app/app.config.ts` (solo `provideBrowserGlobalErrorListeners` + `provideServiceWorker`)
- [x] Crear `projects/calculator/src/app/app.routes.ts` (array vacío)
- [x] Crear `projects/calculator/src/app/app.ts` + `app.html` (shell mínimo: `<h1>Calculadora</h1>`)
- [x] Crear `projects/calculator/src/app/app.spec.ts` (test básico: el componente crea)
- [x] **Verificar**: `ng build --project calculator` compila sin errores

---

## Phase 1: Core models y conversiones

- [x] Crear `src/app/core/models/unit.model.ts` con `UnitCategory`, `UnitDefinition`, `UnitCategoryMeta`
- [x] Crear `src/app/core/models/expression.model.ts` con `TokenType`, `Token`, `ExpressionNode` (BinaryOpNode, UnaryMinusNode, ValueNode), `EvalResult`, `HistoryEntry`
- [x] Crear `src/app/core/engine/conversion.ts` con la tabla completa de las 6 categorías [TDD]
  - Unidades: Data (B, KB, MB, GB, TB), Weight (g, kg, lb, oz), Volume (mL, L, gal, floz), Length (mm, cm, m, km, in, ft, mi), Temperature (K, C, F), Numeric (vacío)
  - Funciones `toBase` y `fromBase` usando la tabla del design §2.3
- [x] Crear `src/app/core/engine/conversion.spec.ts` [TDD]
  - Round-trip: `fromBase(toBase(v)) ≈ v` para todas las unidades
  - Valores conocidos: 1 GB → 1073741824 B, 1 kg → 1000 g, 0 C → 273.15 K, 32 F → 273.15 K
- [x] **Verificar**: `ng test --project calculator --watch=false` — tests de conversion pasan

---

## Phase 2: Expression engine (TDD estricto)

### Tokenizer

- [x] Crear `src/app/core/engine/tokenizer.spec.ts` [RED] con todos los escenarios de `tokenizer.spec.md`
- [x] Crear `src/app/core/engine/tokenizer.ts` [GREEN] implementando `tokenize(input: string): Token[]`
  - Ignorar whitespace
  - Parsear números (enteros y decimales)
  - Longest-match para unidades (lookup en `conversion.ts`)
  - Emitir OPERATOR para +, -, *, /
  - Emitir PAREN_OPEN / PAREN_CLOSE para (, )
  - Error con posición para símbolos desconocidos
- [x] [TRIANGULATE] Añadir casos edge: `floz`, `°C`, `°F`, símbolos ambiguos
- [x] **Verificar**: todos los tests de tokenizer pasan

### Parser

- [x] Crear `src/app/core/engine/parser.spec.ts` [RED]
  - AST correcto para expresiones simples: `3 + 4`
  - Precedencia: `2 + 3 * 4` genera `binary(+, 2, binary(*, 3, 4))`
  - Paréntesis: `(2 + 3) * 4`
  - Unario negativo: `-3`
  - Error: paréntesis sin cerrar
  - Error: operador al final
- [x] Crear `src/app/core/engine/parser.ts` [GREEN] implementando `parse(tokens: Token[]): ExpressionNode`
  - Recursive descent parser con precedencia correcta
- [x] [TRIANGULATE] Casos edge: expresión con solo un número, paréntesis anidados
- [x] **Verificar**: todos los tests de parser pasan

### Evaluator

- [x] Crear `src/app/core/engine/evaluator.spec.ts` [RED] con todos los escenarios de `evaluator.spec.md`
- [x] Crear `src/app/core/engine/evaluator.ts` [GREEN] implementando `evaluate(ast: ExpressionNode, outputUnit?: UnitDefinition): EvalResult`
  - Aritmética pura (sin unidades)
  - Misma unidad: operar directamente
  - Misma categoría, distinta unidad: toBase → operar → fromBase a outputUnit
  - Escalar × unidad: adoptar unidad del operando con unidad
  - Categorías distintas: lanzar error
  - `*` o `/` con dos operandos con unidad: lanzar error
  - Temperatura: tratamiento delta para `+` y `-`
  - División por cero: lanzar error
  - Resultado Infinity / NaN: lanzar error descriptivo
  - `formatted`: usar `Intl.NumberFormat('es-ES')`, máx 10 dígitos significativos
- [x] [TRIANGULATE] Round-trip temperatura, valores grandes, decimales
- [x] **Verificar**: todos los tests del evaluator pasan

---

## Phase 3: Services

### HistoryService

- [x] Crear `src/app/core/services/history.service.spec.ts` [RED]
  - `entries` inicialmente vacío
  - `addEntry()` prepend
  - `clearHistory()` vacía el array
- [x] Crear `src/app/core/services/history.service.ts` [GREEN]
- [x] **Verificar**: tests de HistoryService pasan

### CalculatorService

- [x] Crear `src/app/core/services/calculator.service.spec.ts` [RED]
  - `expression` arranca vacío
  - `appendToExpression('5')` añade `'5'`
  - `appendToExpression('+')` añade `'+'`
  - `appendToExpression('GB')` añade `'GB'`
  - `deleteLast()` elimina el último carácter
  - `clearExpression()` resetea a `''`
  - `result` computed se actualiza al cambiar `expression`
  - `error` computed refleja errores del pipeline
  - `calculate()` llama a `HistoryService.addEntry()` en éxito
  - `setCategory()` cambia `activeCategory` y resetea `outputUnit`
  - `setOutputUnit()` cambia `outputUnit` y recomputa `result`
  - `loadExpression()` reemplaza la expresión actual
- [x] Crear `src/app/core/services/calculator.service.ts` [GREEN]
  - Exportar: `expression`, `activeCategory`, `outputUnit`, `result`, `error`, `quickUnits`, `categories`
  - Métodos: `appendToExpression`, `deleteLast`, `clearExpression`, `calculate`, `setCategory`, `setOutputUnit`, `loadExpression`
  - Inyecta `HistoryService`
- [x] [TRIANGULATE] Casos de keyPress especiales: `'C'` → clear, `'⌫'` → deleteLast, `'='` → calculate
- [x] **Verificar**: todos los tests de CalculatorService pasan

---

## Phase 4: Components

### HeaderComponent

- [x] Crear `src/app/components/header/header.component.spec.ts` [RED] (renderiza título)
- [x] Crear `src/app/components/header/header.component.ts` + `.html` [GREEN]
  - Muestra título "Calculadora"
  - Botón de instalación PWA (usando `beforeinstallprompt` vía signal interno)
- [x] Crear `src/app/components/header/header.spec.md` (si no existe)
- [x] **Verificar**: tests de HeaderComponent pasan

### DisplayComponent

- [x] Crear `src/app/components/display/display.component.spec.ts` [RED] cubriendo todos los escenarios de `display.spec.md`
- [x] Crear `src/app/components/display/display.component.ts` + `.html` [GREEN]
  - `expression = input.required<string>()`
  - `result = input<EvalResult | null>(null)`
  - `error = input<string | null>(null)`
  - Línea superior: expresión (text-right, text-gray-400, texto pequeño, overflow-x auto)
  - Línea inferior: resultado en grande o error en rojo
  - Placeholder cuando expresión vacía
- [x] [TRIANGULATE] Edge cases: error tiene prioridad, expresión larga
- [x] **Verificar**: tests de DisplayComponent pasan

### KeypadComponent

- [x] Crear `src/app/components/keypad/keypad.component.spec.ts` [RED] cubriendo todos los escenarios de `keypad.spec.md`
- [x] Crear `src/app/components/keypad/keypad.component.ts` + `.html` [GREEN]
  - `quickUnits = input<UnitDefinition[]>([])`
  - `keyPress = output<string>()`
  - Grid 4 columnas: dígitos, operadores, funciones especiales
  - Fila de unidades rápidas solo cuando `quickUnits.length > 0`
  - Colores de botones según tipo (ver design §6.2)
- [x] [TRIANGULATE] Accesibilidad: `aria-label` en botones especiales
- [x] **Verificar**: tests de KeypadComponent pasan

### UnitSelectorComponent

- [x] Crear `src/app/components/unit-selector/unit-selector.component.spec.ts` [RED] cubriendo `unit-selector.spec.md`
- [x] Crear `src/app/components/unit-selector/unit-selector.component.ts` + `.html` [GREEN]
  - `categories = input.required<readonly UnitCategoryMeta[]>()`
  - `activeCategory = input.required<UnitCategory>()`
  - `outputUnit = input<UnitDefinition | null>(null)`
  - `categoryChange = output<UnitCategory>()`
  - `outputUnitChange = output<UnitDefinition | null>()`
  - Pills horizontales (scroll) para categorías
  - Dropdown para output unit (oculto en modo numérico)
- [x] **Verificar**: tests de UnitSelectorComponent pasan

### HistoryPanelComponent

- [x] Crear `src/app/components/history-panel/history-panel.component.spec.ts` [RED] cubriendo `history-panel.spec.md`
- [x] Crear `src/app/components/history-panel/history-panel.component.ts` + `.html` [GREEN]
  - `entries = input.required<readonly HistoryEntry[]>()`
  - `entrySelected = output<HistoryEntry>()`
  - `clearHistory = output<void>()`
  - `isExpanded = signal(false)` (estado interno)
  - Toggle con contador: "Historial (N)"
  - Lista de entradas: expresión + resultado formateado + timestamp relativo
  - Botón "Limpiar"
  - Estado vacío: "Sin historial"
- [x] **Verificar**: tests de HistoryPanelComponent pasan

---

## Phase 5: App integration

- [x] Actualizar `app.ts` para inyectar `CalculatorService` y `HistoryService`
- [x] Actualizar `app.html` con layout completo (ver diseño §6.1):
  - `<app-header />`
  - `<app-display [expression] [result] [error] />`
  - `<app-unit-selector [categories] [activeCategory] [outputUnit] (categoryChange) (outputUnitChange) />`
  - `<app-keypad [quickUnits] (keyPress) />`
  - `<app-history-panel [entries] (entrySelected) (clearHistory) />`
  - `<app-toast-outlet />` de `@shared/ui`
- [x] Implementar handlers en `app.ts`:
  - `onKeyPress(key)`: delegar a `CalculatorService` según la tecla
  - `onCategoryChange(cat)`: `calc.setCategory(cat)`
  - `onOutputUnitChange(unit)`: `calc.setOutputUnit(unit)`
  - `onEntrySelected(entry)`: `calc.loadExpression(entry.expression)`
  - `onClearHistory()`: `history.clearHistory()`
- [x] Actualizar `app.spec.ts` con test de integración end-to-end:
  - Usuario escribe `2 GB + 512 MB`, pulsa `=`, resultado `2.5 GB`
  - La entrada aparece en historial
- [x] **Verificar**: `ng serve --project calculator` funciona en el navegador

---

## Phase 6: PWA assets

- [x] Crear `projects/calculator/public/manifest.webmanifest` (ver design §5.5)
- [x] Crear `projects/calculator/ngsw-config.json` (ver design §5.6)
- [x] Añadir `projects/calculator/public/favicon.ico` (copiar de otro proyecto como placeholder)
- [x] Añadir iconos PWA en `projects/calculator/public/icons/` (8 tamaños, placeholder)
- [x] **Verificar**: `ng build --project calculator --configuration production` compila con SW
- [x] **Verificar**: en el navegador, el SW se registra y la app funciona offline (DevTools → Application)

---

## Phase 7: Store catalog

- [x] Añadir entrada `calculator` en `projects/store/src/app/data/tools.data.ts`:
  ```ts
  { id: 'calculator', name: 'Calculadora', description: 'Calculadora con conversor de unidades', icon: '🧮', url: '/calculator', available: true }
  ```
  (ajustar la estructura al modelo existente del fichero)
- [x] **Verificar**: `ng build --project store` compila sin errores

---

## Phase 8: Verificación final

- [x] `ng test --project calculator --watch=false` — todos los tests pasan
- [x] `ng build --project calculator` — sin errores ni warnings de budget
- [x] `ng build --project store` — sin errores
- [x] Actualizar `project.spec.md` — añadir `calculator` a la tabla de estado de proyectos
- [x] Guardar `calculator.verify-report.md` con resultados de los tests

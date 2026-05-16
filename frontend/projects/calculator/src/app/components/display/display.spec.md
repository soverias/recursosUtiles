# Spec: DisplayComponent

## Responsabilidad

Mostrar la expresión actual que el usuario está escribiendo y el resultado calculado (o un mensaje de error). Componente puramente presentacional — no tiene lógica propia.

## Inputs

| Input | Tipo | Descripción |
|-------|------|-------------|
| `expression` | `string` (required) | Expresión actual sin evaluar |
| `result` | `EvalResult \| null` | Resultado de la última evaluación |
| `error` | `string \| null` | Mensaje de error si la expresión es inválida |

## Outputs

Ninguno.

---

## Scenarios

### Scenario: Mostrar expresión actual
- **Given** `expression = "2 GB + 500"` y `result = null`
- **When** se renderiza el componente
- **Then** se muestra el texto `"2 GB + 500"` en la línea de expresión

### Scenario: Mostrar resultado con unidad
- **Given** `result = { value: 2548, unit: { symbol: 'MB', ... }, formatted: '2548 MB' }`
- **When** se renderiza
- **Then** la línea de resultado muestra `"2548 MB"` en tamaño grande y negrita

### Scenario: Mostrar resultado numérico puro
- **Given** `result = { value: 42, unit: null, formatted: '42' }`
- **When** se renderiza
- **Then** la línea de resultado muestra `"42"`

### Scenario: Mostrar error
- **Given** `error = "División por cero"` y `result = null`
- **When** se renderiza
- **Then** se muestra `"División por cero"` en color rojo
- **And** la línea de resultado no muestra ningún valor

### Scenario: Error tiene prioridad sobre resultado
- **Given** `error = "No se puede operar GB con kg"` y `result` tiene un valor previo
- **When** se renderiza
- **Then** solo se muestra el error, no el resultado anterior

### Scenario: Expresión vacía — placeholder
- **Given** `expression = ""`
- **When** se renderiza
- **Then** se muestra un texto placeholder (ej. `"0"` o `"Escribe una expresión"`)

### Scenario: Expresión larga — scroll horizontal
- **Given** `expression` es una cadena muy larga
- **When** se renderiza
- **Then** la línea de expresión hace scroll horizontal sin desbordar el contenedor

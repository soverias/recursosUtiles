# Spec: evaluator

## Responsabilidad

Función pura `evaluate(ast: ExpressionNode, outputUnit?: UnitDefinition): EvalResult` que recorre el AST y calcula el resultado, aplicando conversiones de unidades cuando es necesario. Sin dependencias Angular.

---

## Scenarios: Aritmética numérica pura

### Scenario: Suma
- `3 + 4` → `{ value: 7, unit: null, formatted: "7" }`

### Scenario: Resta
- `10 - 3` → `{ value: 7, unit: null }`

### Scenario: Multiplicación
- `3 * 4` → `{ value: 12, unit: null }`

### Scenario: División
- `10 / 4` → `{ value: 2.5, unit: null }`

### Scenario: Precedencia
- `2 + 3 * 4` → `{ value: 14, unit: null }` (no 20)

### Scenario: Paréntesis
- `(2 + 3) * 4` → `{ value: 20, unit: null }`

### Scenario: Unario negativo
- `-(3 + 4)` → `{ value: -7, unit: null }`

### Scenario: División por cero
- `5 / 0` → lanza error `"División por cero"`

---

## Scenarios: Misma unidad

### Scenario: Suma misma unidad
- `3 GB + 2 GB` → `{ value: 5, unit: GB }`

### Scenario: Resta misma unidad
- `5 MB - 2 MB` → `{ value: 3, unit: MB }`

---

## Scenarios: Unidades distintas misma categoría

### Scenario: GB + MB → resultado en MB
- `1 GB + 512 MB`, outputUnit = MB → `{ value: 1536, unit: MB }`

### Scenario: GB + MB → resultado en GB
- `1 GB + 512 MB`, outputUnit = GB → `{ value: 1.5, unit: GB }`

### Scenario: kg - g → resultado en g
- `1 kg - 200 g`, outputUnit = g → `{ value: 800, unit: g }`

### Scenario: cm + m → resultado en cm
- `100 cm + 1 m`, outputUnit = cm → `{ value: 200, unit: cm }`

### Scenario: Sin outputUnit — usa unidad del operando izquierdo
- `1 GB + 512 MB`, outputUnit = null → resultado en GB = `{ value: 1.5, unit: GB }`

---

## Scenarios: Escalar × unidad

### Scenario: Multiplicar unidad por número
- `2 GB * 3` → `{ value: 6, unit: GB }`

### Scenario: Número multiplicado por unidad
- `3 * 2 GB` → `{ value: 6, unit: GB }`

### Scenario: Dividir unidad entre número
- `6 GB / 2` → `{ value: 3, unit: GB }`

---

## Scenarios: Errores de unidades

### Scenario: Unidades de distintas categorías
- `2 GB + 3 kg` → lanza `"No se puede operar GB con kg"`

### Scenario: Multiplicar dos valores con unidades
- `2 GB * 3 MB` → lanza error sobre multiplicación de unidades

### Scenario: Dividir dos valores con unidades
- `6 GB / 2 MB` → lanza error sobre división de unidades

---

## Scenarios: Temperatura (tratamiento delta)

### Scenario: Suma de temperaturas misma unidad
- `20 C + 5 C` → `{ value: 25, unit: C }`

### Scenario: Resta de temperaturas misma unidad
- `30 C - 10 C` → `{ value: 20, unit: C }`

### Scenario: Suma temperaturas distintas unidades
- `0 C + 32 F`, outputUnit = C → `{ value: 17.78, unit: C }` (32 F como delta = 17.78 °C)

---

## Scenarios: Casos límite

### Scenario: Resultado Infinity
- `1 / 0` con expresión que produce Infinity → lanza `"Resultado demasiado grande"` (o maneja como div/0)

### Scenario: Conversión round-trip
- Para cualquier unidad: `fromBase(toBase(v))` ≈ `v` (precisión de al menos 6 dígitos significativos)

### Scenario: Valor único sin operación
- AST con un solo `ValueNode { amount: 42, unit: GB }` → `{ value: 42, unit: GB, formatted: "42 GB" }`

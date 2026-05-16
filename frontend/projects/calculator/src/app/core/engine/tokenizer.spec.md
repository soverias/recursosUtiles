# Spec: tokenizer

## Responsabilidad

Función pura `tokenize(input: string): Token[]` que convierte una cadena de texto en una secuencia de tokens. Sin dependencias Angular.

## Tipos de token

| TokenType | Descripción |
|-----------|-------------|
| `NUMBER` | Literal numérico: `42`, `3.14` |
| `UNIT` | Símbolo de unidad: `GB`, `kg`, `C`, etc. |
| `OPERATOR` | `+`, `-`, `*`, `/` |
| `PAREN_OPEN` | `(` |
| `PAREN_CLOSE` | `)` |
| `EOF` | Fin de entrada |

---

## Scenarios

### Scenario: Número entero
- **Given** input `"42"`
- **Then** tokens = `[NUMBER("42"), EOF]`

### Scenario: Número decimal
- **Given** input `"3.14"`
- **Then** tokens = `[NUMBER("3.14"), EOF]`

### Scenario: Número con unidad (con espacio)
- **Given** input `"2 GB"`
- **Then** tokens = `[NUMBER("2"), UNIT("GB"), EOF]`

### Scenario: Número con unidad (sin espacio)
- **Given** input `"2GB"`
- **Then** tokens = `[NUMBER("2"), UNIT("GB"), EOF]`

### Scenario: Expresión simple con dos valores y unidades
- **Given** input `"2 GB + 500 MB"`
- **Then** tokens = `[NUMBER("2"), UNIT("GB"), OPERATOR("+"), NUMBER("500"), UNIT("MB"), EOF]`

### Scenario: Expresión con paréntesis
- **Given** input `"(3 + 4) * 2"`
- **Then** tokens = `[PAREN_OPEN, NUMBER("3"), OPERATOR("+"), NUMBER("4"), PAREN_CLOSE, OPERATOR("*"), NUMBER("2"), EOF]`

### Scenario: Operadores disponibles
- **Given** input `"1 + 2 - 3 * 4 / 5"`
- **Then** se emiten los 4 operadores en orden: `+`, `-`, `*`, `/`

### Scenario: Whitespace ignorado
- **Given** input `"  2  +  3  "`
- **Then** tokens = `[NUMBER("2"), OPERATOR("+"), NUMBER("3"), EOF]`

### Scenario: Input vacío o solo espacios
- **Given** input `""`
- **Then** tokens = `[EOF]`

### Scenario: Símbolo de temperatura C
- **Given** input `"20 C"`
- **Then** tokens = `[NUMBER("20"), UNIT("C"), EOF]`

### Scenario: Símbolo de temperatura °C
- **Given** input `"20 °C"`
- **Then** tokens = `[NUMBER("20"), UNIT("°C"), EOF]` (o equivalente canonicalizado a `C`)

### Scenario: Símbolo desconocido después de número
- **Given** input `"5 XYZ"`
- **Then** lanza error `"Unidad desconocida: 'XYZ' en posición 2"` (o similar)

### Scenario: Unidad case-sensitive
- **Given** input `"2 gb"` (minúsculas)
- **Then** lanza error de unidad desconocida (solo `GB` es válido)

### Scenario: Longest-match para unidades
- **Given** input `"5 km"`
- **Then** tokens = `[NUMBER("5"), UNIT("km"), EOF]` (no `k` + `m`)

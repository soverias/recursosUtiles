# Spec: KeypadComponent

## Responsabilidad

Teclado de la calculadora. Renderiza los botones de dígitos, operadores, paréntesis, funciones especiales (C, ⌫, =) y botones de unidades rápidas. Emite un evento por cada pulsación.

## Inputs

| Input | Tipo | Descripción |
|-------|------|-------------|
| `quickUnits` | `UnitDefinition[]` | Unidades de la categoría activa para los botones rápidos |

## Outputs

| Output | Tipo | Descripción |
|--------|------|-------------|
| `keyPress` | `string` | Carácter o símbolo emitido: `'0'`–`'9'`, `'.'`, `'+'`, `'-'`, `'*'`, `'/'`, `'('`, `')'`, `'C'`, `'⌫'`, `'='`, o el `symbol` de una unidad |

---

## Scenarios

### Scenario: Botones de dígitos
- **Given** el keypad se renderiza
- **When** se muestra
- **Then** hay 10 botones, uno por cada dígito del 0 al 9

### Scenario: Botones de operadores
- **Given** el keypad se renderiza
- **When** se muestra
- **Then** hay botones para `+`, `-`, `*`, `/`

### Scenario: Botones de función
- **Given** el keypad se renderiza
- **When** se muestra
- **Then** hay botones para `(`, `)`, `.`, `C`, `⌫`, `=`

### Scenario: Pulsar un dígito emite keyPress
- **Given** el keypad está renderizado
- **When** el usuario pulsa el botón `7`
- **Then** se emite `keyPress` con el valor `'7'`

### Scenario: Pulsar un operador emite keyPress
- **When** el usuario pulsa `+`
- **Then** se emite `keyPress` con el valor `'+'`

### Scenario: Pulsar C emite keyPress 'C'
- **When** el usuario pulsa el botón Clear
- **Then** se emite `keyPress` con el valor `'C'`

### Scenario: Pulsar ⌫ emite keyPress '⌫'
- **When** el usuario pulsa el botón Backspace
- **Then** se emite `keyPress` con el valor `'⌫'`

### Scenario: Pulsar = emite keyPress '='
- **When** el usuario pulsa el botón Igual
- **Then** se emite `keyPress` con el valor `'='`

### Scenario: Botones de unidades rápidas — con unidades
- **Given** `quickUnits = [{ symbol: 'GB', ... }, { symbol: 'MB', ... }, { symbol: 'KB', ... }]`
- **When** el keypad se renderiza
- **Then** aparece una fila con botones `GB`, `MB`, `KB`

### Scenario: Pulsar un botón de unidad rápida
- **Given** aparece el botón `GB`
- **When** el usuario lo pulsa
- **Then** se emite `keyPress` con el valor `'GB'`

### Scenario: Sin unidades rápidas
- **Given** `quickUnits = []`
- **When** el keypad se renderiza
- **Then** no se muestra ninguna fila de unidades rápidas

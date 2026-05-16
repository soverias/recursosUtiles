# Spec: HistoryPanelComponent

## Responsabilidad

Panel colapsable que muestra el historial de cálculos realizados en la sesión. Permite al usuario reutilizar expresiones anteriores y limpiar el historial.

## Inputs

| Input | Tipo | Descripción |
|-------|------|-------------|
| `entries` | `readonly HistoryEntry[]` (required) | Lista de entradas del historial (más reciente primero) |

## Outputs

| Output | Tipo | Descripción |
|--------|------|-------------|
| `entrySelected` | `HistoryEntry` | Emitido cuando el usuario pulsa una entrada |
| `clearHistory` | `void` | Emitido cuando el usuario pulsa "Limpiar" |

## Estado interno

| Signal | Tipo | Descripción |
|--------|------|-------------|
| `isExpanded` | `signal<boolean>` | Si el panel está abierto o cerrado (inicial: `false`) |

---

## Scenarios

### Scenario: Panel colapsado por defecto
- **Given** el componente se renderiza por primera vez
- **When** se muestra
- **Then** el panel está cerrado y no se ven las entradas

### Scenario: Expandir panel
- **Given** el panel está cerrado
- **When** el usuario pulsa el botón toggle ("Historial")
- **Then** el panel se expande y se muestran las entradas

### Scenario: Colapsar panel
- **Given** el panel está abierto
- **When** el usuario pulsa el botón toggle
- **Then** el panel se cierra

### Scenario: Mostrar contador en toggle
- **Given** `entries` tiene 3 entradas
- **When** se muestra el botón toggle
- **Then** el texto dice `"Historial (3)"` o similar

### Scenario: Mostrar entradas
- **Given** el panel está expandido y hay 2 entradas
- **When** se renderiza
- **Then** cada entrada muestra: la expresión original y el resultado formateado

### Scenario: Entradas más recientes primero
- **Given** las entradas son `[{expr: "2+2"}, {expr: "1+1"}]` (más reciente primero)
- **When** se renderiza
- **Then** la entrada `2+2` aparece antes que `1+1`

### Scenario: Pulsar una entrada
- **Given** el panel está expandido con una entrada `"3 + 4 = 7"`
- **When** el usuario pulsa esa entrada
- **Then** se emite `entrySelected` con esa `HistoryEntry`

### Scenario: Botón limpiar
- **Given** el panel está expandido con entradas
- **When** el usuario pulsa "Limpiar"
- **Then** se emite `clearHistory`

### Scenario: Sin entradas
- **Given** `entries = []` y el panel está expandido
- **When** se renderiza
- **Then** se muestra un mensaje indicando que no hay historial (ej. `"Sin historial"`)

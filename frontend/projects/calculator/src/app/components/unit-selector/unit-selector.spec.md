# Spec: UnitSelectorComponent

## Responsabilidad

Permite al usuario seleccionar la categoría de unidades activa (Data, Peso, Volumen, Longitud, Temperatura, Numérico) y la unidad de salida para el resultado. Componente puramente presentacional.

## Inputs

| Input | Tipo | Descripción |
|-------|------|-------------|
| `categories` | `readonly UnitCategoryMeta[]` (required) | Lista de todas las categorías disponibles |
| `activeCategory` | `UnitCategory` (required) | Categoría actualmente seleccionada |
| `outputUnit` | `UnitDefinition \| null` | Unidad de salida seleccionada (null = automática) |

## Outputs

| Output | Tipo | Descripción |
|--------|------|-------------|
| `categoryChange` | `UnitCategory` | Emitido al seleccionar una nueva categoría |
| `outputUnitChange` | `UnitDefinition \| null` | Emitido al cambiar la unidad de salida |

---

## Scenarios

### Scenario: Mostrar pills de categorías
- **Given** `categories` contiene 6 categorías
- **When** se renderiza
- **Then** se muestran 6 pills/botones con el label de cada categoría

### Scenario: Categoría activa resaltada
- **Given** `activeCategory = 'data'`
- **When** se renderiza
- **Then** el pill `Datos` tiene estilo visual destacado (diferente a los demás)

### Scenario: Cambiar categoría
- **Given** la categoría activa es `'numeric'`
- **When** el usuario pulsa el pill `Peso`
- **Then** se emite `categoryChange` con `'weight'`

### Scenario: Selector de output unit — visible en categorías con unidades
- **Given** `activeCategory = 'data'`
- **When** se renderiza
- **Then** aparece un dropdown/selector con las unidades de la categoría Data

### Scenario: Selector de output unit — oculto en modo numérico
- **Given** `activeCategory = 'numeric'`
- **When** se renderiza
- **Then** el selector de unidad de salida no aparece

### Scenario: Seleccionar unidad de salida
- **Given** el dropdown de output unit está visible con las unidades de Data
- **When** el usuario selecciona `MB`
- **Then** se emite `outputUnitChange` con el `UnitDefinition` de `MB`

### Scenario: Unidad de salida actual mostrada
- **Given** `outputUnit = { symbol: 'GB', ... }`
- **When** se renderiza
- **Then** el dropdown muestra `GB` como opción seleccionada

### Scenario: Opción automática
- **Given** `outputUnit = null`
- **When** se renderiza
- **Then** el dropdown muestra "Automático" o la opción por defecto

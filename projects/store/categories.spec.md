# Spec: categories

**Change**: categories  
**Version**: 1.0  
**Date**: 2026-04-04  
**Status**: implemented  

---

## 1. Contexto y alcance

Añadir un sistema de filtrado por categoría a la home de la store. El modelo `Tool` ya tiene el campo `category: string` — este change añade la UI y la lógica reactiva para filtrar el grid.

**Fuera de alcance:**
- Gestión de categorías desde backend
- Categorías con icono o color propio
- Multi-selección de categorías
- URL params para categoría activa

---

## 2. Capability: category-filter (nueva)

### Requirement: Mostrar opciones de categoría

El sistema MUST mostrar un chip "Todas" más un chip por cada categoría única derivada de `TOOLS`.

#### Scenario: CAT-01 — muestra todas las categorías disponibles
- GIVEN la store tiene herramientas con categorías "games" y "utilities"
- WHEN el usuario carga la home
- THEN se muestran chips para "Todas", "games" y "utilities"

#### Scenario: CAT-01b — categorías derivadas dinámicamente
- GIVEN `TOOLS` contiene herramientas de una sola categoría
- WHEN el usuario carga la home
- THEN solo se muestran "Todas" y ese chip de categoría

---

### Requirement: Filtrado por selección

El sistema MUST filtrar el grid al seleccionar un chip de categoría.

#### Scenario: CAT-02 — filtrar por categoría
- GIVEN el usuario está en la home
- WHEN hace clic en un chip de categoría
- THEN el grid muestra solo las herramientas de esa categoría

#### Scenario: CAT-02b — mostrar todas
- GIVEN hay un filtro de categoría activo
- WHEN el usuario hace clic en "Todas"
- THEN el grid muestra todas las herramientas

---

### Requirement: Estado por defecto

El sistema MUST arrancar con "Todas" activo (sin filtro).

#### Scenario: CAT-03 — estado inicial
- GIVEN el usuario carga la home
- WHEN no ha interactuado con los chips
- THEN "Todas" está activo y se muestran todas las herramientas

---

### Requirement: Indicación visual del chip activo

El chip activo MUST ser visualmente distinto de los inactivos.

#### Scenario: CAT-04 — chip activo resaltado
- GIVEN hay un filtro activo
- WHEN el usuario ve los chips
- THEN el chip activo está visualmente diferenciado del resto

---

## 3. Capability: home (modificada)

### MODIFIED Requirement: Renderizar herramientas

El componente MUST renderizar un `<app-card>` por cada herramienta del **catálogo filtrado activo**.  
_(Anteriormente: mostraba todas las herramientas de `TOOLS` sin filtrar)_

#### Scenario: HOME-01 — renderiza una app-card por herramienta filtrada
- GIVEN el catálogo tiene herramientas de varias categorías
- WHEN el filtro activo es "Todas"
- THEN se renderiza una `app-card` por cada herramienta en `TOOLS`

#### Scenario: HOME-01b — filtra el grid al cambiar categoría
- GIVEN el catálogo tiene herramientas de categorías "games" y "utilities"
- WHEN el filtro activo es "games"
- THEN solo se renderizan las `app-card` de categoría "games"

#### Scenario: HOME-02 — grid responsive
- GIVEN el usuario carga la home
- WHEN se renderiza el grid
- THEN el contenedor tiene clases `grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3`

---

### ADDED Requirement: Incluir selector de categoría

El componente MUST renderizar el `CategoryFilterComponent` encima del grid.

#### Scenario: HOME-03 — selector visible
- GIVEN el usuario carga la home
- WHEN se renderiza la página
- THEN el `CategoryFilterComponent` es visible encima del grid de herramientas

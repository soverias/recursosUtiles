# Design: categories

**Change**: categories  
**Version**: 1.0  
**Date**: 2026-04-04  

---

## Technical Approach

Estado de filtrado local en `HomeComponent` mediante signals. Las categorías se derivan con `computed()` de `TOOLS`. Un nuevo `CategoryFilterComponent` recibe inputs y emite la selección. Sin servicio — es UI state puro.

---

## Architecture Decisions

### Decision: Estado en HomeComponent, no en servicio

| | |
|-|-|
| **Choice** | `signal` en `HomeComponent` |
| **Alternatives** | servicio compartido, route param |
| **Rationale** | El filtrado es estado local de la vista; no necesita persistirse ni compartirse |

### Decision: "Todas" representado como `null`

| | |
|-|-|
| **Choice** | `activeCategory = signal<string \| null>(null)` |
| **Alternatives** | string vacío `''`, string literal `'all'` |
| **Rationale** | `null` es semánticamente "sin filtro", evita colisión con valores reales de categoría |

### Decision: CategoryFilterComponent con inputs/output unidireccional

| | |
|-|-|
| **Choice** | `input.required<string[]>()` + `input<string \| null>()` + `output<string \| null>()` |
| **Alternatives** | two-way binding con `model()` |
| **Rationale** | Flujo unidireccional — más predecible y fácil de testear |

---

## Data Flow

```
TOOLS (static array)
  └─→ HomeComponent
        ├── categories     = computed(() => unique categories from TOOLS)
        ├── activeCategory = signal<string | null>(null)
        ├── filteredTools  = computed(() =>
        │     activeCategory() ? TOOLS.filter(t => t.category === activeCategory()) : TOOLS
        │   )
        │
        ├─→ <app-category-filter>
        │     [categories]="categories()"
        │     [active]="activeCategory()"
        │     (categorySelected)="activeCategory.set($event)"
        │
        └─→ <app-card> × filteredTools()
```

---

## File Changes

| Fichero | Acción | Descripción |
|---------|--------|-------------|
| `components/category-filter/category-filter.component.ts` | Crear | Chip selector: inputs + output |
| `components/category-filter/category-filter.component.html` | Crear | Template chips con Tailwind |
| `components/category-filter/category-filter.component.spec.ts` | Crear | Tests CAT-01..04 |
| `components/home/home.component.ts` | Modificar | Añadir signals + importar CategoryFilterComponent |
| `components/home/home.component.html` | Modificar | Usar `filteredTools()` + incluir `<app-category-filter>` |
| `components/home/home.component.spec.ts` | Modificar | Actualizar HOME-01, añadir HOME-01b y HOME-03 |

---

## Interfaces / Contracts

```ts
// CategoryFilterComponent
categories       = input.required<string[]>();
active           = input<string | null>(null);
categorySelected = output<string | null>();

// HomeComponent (additions)
readonly activeCategory = signal<string | null>(null);
readonly categories     = computed(() => [...new Set(TOOLS.map(t => t.category))]);
readonly filteredTools  = computed(() =>
  this.activeCategory()
    ? TOOLS.filter(t => t.category === this.activeCategory())
    : TOOLS
);
```

---

## Testing Strategy

| Layer | Qué testear | Enfoque |
|-------|------------|---------|
| Unit | `CategoryFilterComponent`: renderiza chips, emite selección, resalta activo | Vitest + TestBed |
| Unit | `HomeComponent`: `filteredTools` computed, HOME-01b filtrado, HOME-03 selector visible | Vitest + TestBed |

---

## Migration

No migration required. El modelo `Tool` no cambia.

## Open Questions

Ninguna.

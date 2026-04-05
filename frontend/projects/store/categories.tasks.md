# Tasks: categories

**Change**: categories  
**Version**: 1.0  
**Date**: 2026-04-04  
**Status**: completed  

---

## Phase 1: CategoryFilterComponent (TDD)

- [x] 1.1 **RED**: Crear `components/category-filter/category-filter.component.spec.ts` con tests CAT-01, CAT-01b, CAT-02, CAT-02b, CAT-03, CAT-04 (el componente aún no existe — los tests deben fallar)
- [x] 1.2 Crear `components/category-filter/category-filter.component.ts` — shell mínimo (selector, inputs `categories`/`active`, output `categorySelected`) para que los tests compilen
- [x] 1.3 **GREEN**: Implementar `category-filter.component.html` con chips Tailwind hasta pasar todos los tests de fase 1

## Phase 2: HomeComponent — actualización (TDD)

- [x] 2.1 **RED**: Actualizar `components/home/home.component.spec.ts` — modificar HOME-01 para usar `filteredTools`, añadir HOME-01b (filtrado por categoría) y HOME-03 (selector visible)
- [x] 2.2 **GREEN**: Actualizar `components/home/home.component.ts` — añadir signals `activeCategory`, `categories`, `filteredTools`; importar `CategoryFilterComponent`
- [x] 2.3 **GREEN**: Actualizar `components/home/home.component.html` — sustituir `tools` por `filteredTools()`, añadir `<app-category-filter>` con bindings

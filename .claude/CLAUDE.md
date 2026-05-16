## Engram — Nombre canónico del proyecto desde la raíz

Este Claude opera desde la **raíz del monorepo** (`recursosUtiles/`). El monorepo tiene dos namespaces engram independientes:

- **`recursosutiles`** → trabajo del frontend (Angular workspace en `frontend/`)
- **`recursosutiles-server`** → trabajo del backend (.NET solution en `backend/`)

### Regla de uso desde la raíz

- Para **trabajo cross-cutting** (specs raíz, contratos compartidos, decisiones que afectan a ambos lados): usar `recursosutiles`. Es el namespace canónico del monorepo y el que tiene más historial acumulado.
- Para **trabajo enfocado en un solo lado**: usar el namespace específico del lado (`recursosutiles` o `recursosutiles-server`). Coherente con el Claude que vive en `frontend/` o `backend/`.
- **Nunca inventar variantes** (`recursos-utiles`, `RecursosUtiles`, etc.) — rompe la búsqueda y se pierde el contexto histórico.

## Convención de specs

Este proyecto sigue la convención de specs en monorepo descrita en el `CLAUDE.md` global del usuario:

- **Specs cross-cutting** (contrato observable entre frontend y backend): `recursosUtiles/specs/<feature>.spec.md`
- **Specs locales** (cómo cada lado implementa su parte): dentro del sub-proyecto correspondiente
- Todo spec lleva header YAML de estado (`status`, `coverage`, `last_change`, `last_verified`, `pending`)

## Idioma

Castellano de España (peninsular) para toda comunicación con el usuario.

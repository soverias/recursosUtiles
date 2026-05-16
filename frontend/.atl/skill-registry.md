# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| Component creation, signal inputs/outputs, host bindings, OnPush, lifecycle hooks | angular-component | C:\Users\sover\.claude\skills\angular-component\SKILL.md |
| Form implementation, validation, multi-step forms, signal forms | angular-forms | C:\Users\sover\.claude\skills\angular-forms\SKILL.md |
| API calls, data fetching, HTTP resources, interceptors, loading states | angular-http | C:\Users\sover\.claude\skills\angular-http\SKILL.md |
| Creating a new Angular application | angular-new-app | C:\Users\sover\.claude\skills\angular-new-app\SKILL.md |
| Route configuration, lazy loading, guards, resolvers, route params | angular-routing | C:\Users\sover\.claude\skills\angular-routing\SKILL.md |
| State management, signal(), computed(), linkedSignal(), effect(), RxJS interop | angular-signals | C:\Users\sover\.claude\skills\angular-signals\SKILL.md |
| Creating a pull request, opening a PR, preparing changes for review | branch-pr | C:\Users\sover\.claude\skills\branch-pr\SKILL.md |
| DDD, Clean Architecture, Hexagonal, ports and adapters, aggregates, CQRS | clean-ddd-hexagonal | C:\Users\sover\.claude\skills\clean-ddd-hexagonal\SKILL.md |
| Find a skill, search skills, install agent capabilities | find-skills | C:\Users\sover\.claude\skills\find-skills\SKILL.md |
| Build web UI, landing pages, dashboards, components, styling | frontend-design | C:\Users\sover\.claude\skills\frontend-design\SKILL.md |
| Go tests, Bubbletea TUI testing, teatest, golden files | go-testing | C:\Users\sover\.claude\skills\go-testing\SKILL.md |
| Creating a GitHub issue, reporting a bug, requesting a feature | issue-creation | C:\Users\sover\.claude\skills\issue-creation\SKILL.md |
| Judgment day, adversarial review, dual review, juzgar | judgment-day | C:\Users\sover\.claude\skills\judgment-day\SKILL.md |
| Create a new skill, document agent patterns, add AI instructions | skill-creator | C:\Users\sover\.claude\skills\skill-creator\SKILL.md |
| Review UI, check accessibility, audit design, check UX | web-design-guidelines | C:\Users\sover\.claude\skills\web-design-guidelines\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### angular-component
- Components are standalone by default — do NOT set `standalone: true` explicitly
- Always use `ChangeDetectionStrategy.OnPush`
- Use `input()`, `input.required()`, `output()` — never `@Input()`, `@Output()` decorators
- Use `host` object in `@Component` — never `@HostBinding` or `@HostListener` decorators
- Use native control flow: `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `[class.x]` and `[style.x]` bindings — never `ngClass` or `ngStyle`
- `@for` always requires `track` expression
- Use `NgOptimizedImage` for static images
- ARIA attributes required on all interactive elements; support keyboard navigation

### angular-forms
- Signal Forms are experimental (Angular v21) — import from `@angular/forms/signals`
- Form model is a `signal<T>()` — single source of truth; form wraps it via `form(model, schema)`
- Validators: `required()`, `email()`, `min()`, `max()`, `minLength()`, `maxLength()`, `pattern()`, `validate()`
- Show errors only after `touched()`: `field.touched() && field.invalid()`
- Use `submit(form, callback)` to validate-on-submit and mark all fields touched
- Conditional validation: `{ when: ({ valueOf }) => valueOf(schemaPath.field) }`
- Cross-field: `validate(field, ({ value, valueOf }) => value() !== valueOf(other) ? error : null)`
- Reset interaction state: `form().reset()`; reset values: `model.set({...})`

### angular-http
- Prefer `httpResource()` for reactive HTTP — auto-refetches when factory signal dependencies change
- Return `undefined` from httpResource factory to skip the request (results in `idle` status)
- Use `resource()` for non-HTTP async operations or custom fetch logic
- Functional interceptors only; register via `withInterceptors([...])` in `provideHttpClient`
- Bridge Observable to signal: `toSignal(http.get<T>(...), { initialValue: [] })`
- Use `defaultValue` option to avoid `undefined` in templates
- Retry on error: `userResource.reload()` in template; `.pipe(retry(2))` with HttpClient

### angular-new-app
- Check CLI: `where ng` (Windows) or `which ng` (*nix) before proceeding
- Create: `npx ng new <name> --interactive=false --ai-config=agents [flags]`
- Use `npx ng generate <schematic> <name>` for all artifacts — note the output path
- Add Tailwind v4: `npx ng add tailwindcss` — no further config needed
- Do NOT start the dev server until features are built; use `npx ng build` to verify

### angular-routing
- Enable signal inputs for route params: `provideRouter(routes, withComponentInputBinding())`
- Route params as signal inputs: `id = input.required<string>()` in the component
- Lazy load single component: `loadComponent: () => import(...).then(m => m.Cmp)`
- Lazy load feature: `loadChildren: () => import(...).then(m => m.featureRoutes)`
- Functional guards only — `export const myGuard: CanActivateFn = (route, state) => ...`
- Redirect from guard: `router.createUrlTree(['/path'])` — not `false`
- Resolvers: `ResolveFn<T>`, access resolved data via `input()` with `withComponentInputBinding()`

### angular-signals
- `signal()` for mutable state; `computed()` for derived state (auto-memoized, lazy)
- `linkedSignal()` for state that resets when its source changes
- `effect()` must be called in injection context (constructor or `runInInjectionContext`)
- Service pattern: private `_state = signal(...)`, expose `readonly state = _state.asReadonly()`
- Use `untracked(() => sig())` to read a signal without registering it as a dependency
- `toSignal(obs$, { initialValue })` bridges RxJS → signals; `toObservable(sig)` for the reverse
- Signals are synchronous — no async in `computed()`, use `resource()` for async derived state

### branch-pr
- Every PR MUST reference an approved issue: `Closes #N` / `Fixes #N` / `Resolves #N`
- Branch naming: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- Add exactly one `type:*` label to every PR
- Commit format: `type(scope): description` — conventional commits required
- No `Co-Authored-By` trailers in commits
- Run `shellcheck scripts/*.sh` before pushing any shell script changes
- PR body MUST include: linked issue, one type checkbox, summary bullets, changes table, test plan

### clean-ddd-hexagonal
- Dependencies point inward only: Infrastructure → Application → Domain (never the reverse)
- Domain layer has ZERO external dependencies — no DB, HTTP, or framework imports
- Controllers never call repositories directly — always route through application use cases
- One repository per aggregate root (not per entity or table)
- Move behavior INTO entities — avoid anemic domain model
- One aggregate per transaction; cross-aggregate consistency via domain events (eventual)
- Value objects: immutable, no setters, equality by structural value
- Domain events: past-tense naming (`OrderPlaced`, `UserRegistered`)

### find-skills
- Search: `npx skills find [query]`
- Install globally: `npx skills add <owner/repo@skill> -g -y`
- Prefer skills with 1K+ installs from official sources (`vercel-labs`, `anthropics`, `microsoft`)
- Browse leaderboard first: https://skills.sh/
- If not found: help directly and suggest `npx skills init` to create a custom skill

### frontend-design
- Commit to a BOLD aesthetic direction before coding — intentionality over intensity
- Never use generic fonts (Inter, Roboto, Arial, system fonts) or purple-gradient-on-white clichés
- Use CSS variables for color palette consistency
- CSS-only animations preferred; use Motion library for React micro-interactions
- Vary light/dark themes and font choices — never repeat the same aesthetic across generations
- Match complexity to vision: maximalist → elaborate animations; minimalist → precision + restraint

### go-testing
- Table-driven tests: `tests := []struct{ name, input, expected string; wantErr bool }{...}`
- TUI state: call `model.Update(tea.KeyMsg{...})` directly and cast result back to Model type
- Full TUI flow: `teatest.NewTestModel(t, m)` → `tm.Send(...)` → `tm.WaitFinished(t, ...)`
- Golden file: write output to `testdata/*.golden`; compare with `os.ReadFile`; update with `-update` flag
- Use `t.TempDir()` for file operations; skip heavy tests with `testing.Short()`

### issue-creation
- Search for duplicates first: `gh issue list --search "keyword"`
- Blank issues are disabled — always use `bug_report.yml` or `feature_request.yml` template
- Issues auto-get `status:needs-review`; maintainer MUST add `status:approved` before any PR
- Questions go to Discussions, NOT issues
- Issue title format: conventional commit style (`fix(scope): description`)

### judgment-day
- Launch TWO independent judge sub-agents in parallel — never sequential, never self-review
- Both judges receive identical prompts; neither knows about the other
- Classify findings: CRITICAL | WARNING (real) | WARNING (theoretical) | SUGGESTION
- Theoretical warnings = INFO only; do NOT fix, do NOT block, do NOT re-judge
- APPROVED: 0 confirmed CRITICALs + 0 confirmed real WARNINGs
- Round 1: present verdict table, ASK user before applying fixes
- After 2 fix iterations with remaining issues → ASK user whether to continue

### skill-creator
- Skill lives at `skills/{name}/SKILL.md` with frontmatter: name, description (must include `Trigger:`), license, metadata
- Structure: When to Use → Critical Patterns → Code Examples → Commands
- `references/` for local doc links only — no web URLs; `assets/` for templates/schemas/configs
- After creating, register the skill in `AGENTS.md`
- License: `Apache-2.0`; author: `gentleman-programming`

### web-design-guidelines
- Fetch latest rules before each review from: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
- Apply ALL rules from the fetched content — do not rely on cached or assumed rules
- Output findings in `file:line` terse format as specified in the fetched guidelines
- If no files are specified, ask the user which files to review

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | C:\Users\sover\Documents\Desarrollo\recursosUtiles\frontend\AGENTS.md | Index — SDD methodology, Angular 21/Tailwind v4/Git conventions |
| project.spec.md | C:\Users\sover\Documents\Desarrollo\recursosUtiles\frontend\project.spec.md | Project description, stack, architecture |
| store.spec.md | C:\Users\sover\Documents\Desarrollo\recursosUtiles\frontend\projects\store\store.spec.md | Store app spec |
| bang-game.spec.md | C:\Users\sover\Documents\Desarrollo\recursosUtiles\frontend\projects\bang-game\bang-game.spec.md | Bang-game app spec |
| secret-friend.spec.md | C:\Users\sover\Documents\Desarrollo\recursosUtiles\frontend\projects\secret-friend\secret-friend.spec.md | Secret-friend app spec |
| shared.spec.md | C:\Users\sover\Documents\Desarrollo\recursosUtiles\frontend\projects\shared\shared.spec.md | Shared UI library spec and API |
| CLAUDE.md | C:\Users\sover\Documents\Desarrollo\recursosUtiles\frontend\CLAUDE.md | Project-level Claude instructions (SDD, respond in Spanish) |

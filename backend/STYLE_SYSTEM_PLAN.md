# UI Style System Alignment Plan

## Goals
- Establish a consistent, modern, accessible design across all surfaces (Search, Report modal, Insights, About)
- Centralize styling via tokens + shared primitives to eliminate ad‑hoc class sprawl
- Enable fast iteration with guardrails (linting/formatting, styleguide)

## Principles
- Single design language: neutral surfaces, clear hierarchy, strong focus states
- Token-first: colors, spacing, typography, radii, shadows via CSS variables
- Tailwind-first utilities with minimal custom CSS
- Accessibility: visible focus, sufficient contrast, semantic HTML

## Deliverables
1) Design Tokens (CSS variables) with light/dark support
2) Tailwind config alignment (theme, container, typography, prose)
3) Shared UI primitives in `frontend/src/components/ui/`
4) Page refactors to primitives (Search, ViewReport, Insights)
5) Styleguide route `/styleguide` to document patterns
6) Tooling: Prettier Tailwind plugin, class merging helper, CVA variants

## Tokens (CSS Variables)
Define in `frontend/src/styles/globals.css`:
- Colors: `--color-bg`, `--color-card`, `--color-border`, `--color-text`, `--color-primary`, `--color-success`, `--color-warn`, `--color-danger`, `--color-muted`
- Radii: `--radius-sm`, `--radius-md`, `--radius-lg`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Typography scale: h1–h4, body, small
- Dark mode via `[data-theme="dark"]` overrides

## Tailwind Configuration
- Map Tailwind theme colors to CSS variables (primary/success/warn/danger)
- Container defaults: `max-w-7xl`, 16px padding
- Extend typography plugin for `prose` defaults
- Add `prettier-plugin-tailwindcss` for class sorting

## Shared Primitives (new)
Create `frontend/src/components/ui/`:
- `Button` (variants: solid/outline/ghost; sizes: sm/md/lg; loading state)
- `Input`, `Textarea`, `Select`
- `Card` (wrapper with header/footer slots)
- `Badge`/`Pill`
- `KPICard` (big number + label; variants: neutral/primary/success/warn)
- `Tabs` (list + panel; keyboard accessible)
- `Table` (compact, bordered, zebra optional)
- `Alert` (info/success/warn/error)
- `Spinner`, `Skeleton`
- Unify `Modal` styles to tokenized spacing, radius, z-index

Each primitive implemented with Tailwind + class-variance-authority (CVA) and exported types.

## Page Refactors (order)
1) Search page
- Replace ad‑hoc textarea/button with `Textarea`/`Button`
- Wrap sections in `Card`
- Replace custom tabs with `Tabs` (Sources/Analysis)
- Normalize typography and spacing

2) Report modal (`ViewReport.tsx`)
- Wrap subsections in `Card`
- KPIs -> `KPICard`
- Badges for categories/domains -> `Badge`
- Loading -> `Spinner` (single blocking state)

3) Insights page
- KPIs -> `KPICard`
- Lists/tables -> `Table`

4) About page
- Use `prose` with consistent spacing

## Styleguide
- Route `/styleguide` showcasing tokens and primitives with code snippets
- Used as PR review checklist for visual consistency

## Tooling & Guardrails
- Add `prettier-plugin-tailwindcss` and enforce via `npm run format`
- Add `clsx` + `tailwind-merge` and a `cn()` helper
- Add `class-variance-authority` for variants
- ESLint rules: import/order, no inline color literals (prefer theme)

## Acceptance Criteria
- All pages use `ui` primitives; no one-off button/card styles remain
- Consistent spacing (`space-y-6` sections; `space-y-3` inside cards)
- Visible, consistent focus ring across interactive elements
- Dark mode switchable by setting `data-theme="dark"` (visual check)

## Rollout Plan
- Phase 1 (Today): Tokens + Tailwind config + `Button`, `Card`, `Badge`, `Spinner`
- Phase 2: Refactor Search + Report to primitives
- Phase 3: Refactor Insights to KPIs/Table
- Phase 4: Add Styleguide + Prettier Tailwind + CVA variants for remaining components

## Risks & Mitigations
- Drift between legacy and new styles → Enforce primitives via code review and styleguide
- Visual regressions → Refactor one page at a time, verify screenshots/live

## Metrics of Success
- Reduced custom class count per page (>40% drop)
- Zero unthemed color declarations in the app
- New UI implemented only with primitives


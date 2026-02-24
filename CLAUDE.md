# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server on localhost:3000
pnpm build        # production build (prerendered SPA)
pnpm test         # run all tests (vitest run)
pnpm lint         # ESLint v9
pnpm tsc --noEmit # type check only
```

Run a single test file:

```bash
pnpm vitest run src/lib/__tests__/defaults.test.ts
```

The verification pipeline before committing is: `pnpm lint && pnpm tsc --noEmit && pnpm test && pnpm build`.

## What This Project Does

A browser-only wizard that generates Microsoft Sentinel **Codeless Connector Framework (CCF)** solution packages. Users fill in ~8 steps (connector identity, table schema, DCR, REST API config, connector UI, content, solution metadata, export) and the app produces a ZIP containing all ARM resource JSON files ready for the Azure-Sentinel packaging tool (`createSolutionV3.ps1`) or a deployable template via an optional Docker sidecar.

**No backend.** All generation is client-side. State persists to `localStorage`.

## Architecture

### State

`src/hooks/useConnectorConfig.tsx` is the single source of truth. It provides:

- Per-connector config slices: `updateMeta()`, `updateSchema()`, `updateDataFlow()`, `updateConnectorUI()`
- Multi-connector management: `connectors[]`, `activeConnectorIndex`, `addConnector()`, `removeConnector()`
- Solution-level (shared): `updateSolution()`
- Content: `analyticRules[]`, `asimParsers[]`
- Session: `importAppState()`, `reset()`, `resumeSavedConfig()`

State auto-saves to localStorage (500 ms debounce via `src/lib/persistence.ts`). Never call `localStorage` directly from components.

### Wizard

`src/components/wizard/ConnectorWizard.tsx` owns step orchestration. Each step is a `StepDef`:

```ts
interface StepDef {
  id: string
  label: string
  component: React.ComponentType
  isValid: (connectors: ConnectorData[], config: ...) => boolean
  showSidebar: boolean          // show per-connector sidebar
  preview: "arm" | "content" | null  // which preview panel to render
  kinds?: ConnectorKind[]       // restrict to Push / RestApiPoller
  badge?: string
}
```

Steps are filtered at render time based on `kinds` (e.g., Step 4 "API Config" only appears for RestApiPoller connectors).

### Schemas

`src/lib/schemas.ts` defines all Zod schemas. **Two-tier pattern:**

- **Lenient** (e.g., `MetaSchema`) — used for state/localStorage, all fields have defaults and tolerate empty strings.
- **Strict** (e.g., `MetaValidation`) — used for step-gating, carries user-facing error messages.

Always derive types from schemas with `z.infer<>`. Never write types that duplicate a schema.

Enum values are defined as `as const` arrays (e.g., `columnTypes`) so they can be iterated in the UI, then passed to `z.enum()`.

### ARM Resource Generators

`src/lib/arm-resources/` contains one file per Azure resource type. Functions are pure: they take config objects and return plain JS objects. No ARM template constructs (`dependsOn`, `resourceId()`, etc.) — those are injected by Microsoft's packaging script. `[parameters('...')]` references are allowed.

`src/lib/download.ts` assembles the full solution ZIP using JSZip.

`src/lib/defaults.ts` generates sensible starting values for the connector UI (graph queries, sample queries, connectivity criteria, permissions, instruction steps). The instruction step defaults vary by connector kind and poller auth type.

### Preview

Two preview panels in `src/components/preview/`:

- `ArmTemplatePreview` — live ARM template JSON (steps 1–5)
- `ContentPreview` — analytic rules / ASIM parsers YAML (step 6)

Steps with `preview: null` (Solution, Export) render full-width with no preview panel and no Show/Hide button.

## Key Conventions

**React imports:** Always `import * as React from "react"`, not the default import.

**Callbacks:** Wrap with `React.useCallback` only when passed to custom components or in `useEffect`/`useMemo` dep arrays. Inline on native HTML elements is fine.

**No prop drilling past two levels** — lift to Context instead.

**Styling:** Tailwind only. Use `cn()` from `src/lib/utils.ts` for conditional classes. Use design tokens (`text-muted-foreground`, `bg-primary`, etc.) — no hardcoded colors. CVA for components with multiple visual variants.

**Business logic** lives in `src/lib/`, never in components. Library functions return plain data, never JSX.

**Unused variables:** Prefix with `_` (e.g., `_tableName`) to satisfy the linter.

**Error handling:** Throw for programmer mistakes (hook outside provider). Silent catch for environment failures (clipboard, localStorage). Never swallow errors in business logic.

## Naming

| Thing | Convention |
|---|---|
| Zod lenient schema | `MetaSchema` |
| Zod strict schema | `MetaValidation` |
| Inferred type | `type Meta = z.infer<typeof MetaSchema>` |
| Context object | `ConnectorConfigContext` |
| Boolean props | `is`/`has`/`can`/`should` prefix |
| Event handlers | `handle` prefix |

## Tests

Tests live alongside the code they test in `__tests__/` subdirectories. The test environment is `node` (no jsdom). Tests are fixture-based — see `src/lib/arm-resources/__tests__/fixtures.ts`. When changing an ARM resource generator, update the corresponding test fixtures.

`routeTree.gen.ts` is auto-generated by TanStack Start — never edit it manually.

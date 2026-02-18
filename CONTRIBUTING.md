# Coding Standards

This document defines the conventions and patterns for this project. All contributions must follow these standards.

---

## Table of Contents

1. [TypeScript](#typescript)
2. [React Components](#react-components)
3. [Hooks](#hooks)
4. [State Management](#state-management)
5. [Validation & Schemas](#validation--schemas)
6. [Styling](#styling)
7. [File & Folder Structure](#file--folder-structure)
8. [Imports](#imports)
9. [Naming Conventions](#naming-conventions)
10. [Error Handling](#error-handling)
11. [TanStack Router](#tanstack-router)
12. [ARM Resource Generators](#arm-resource-generators)

---

## TypeScript

- **Strict mode is enforced.** `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` are all enabled. Code must compile cleanly.
- **Prefer `type` for inferred types, `interface` for structural contracts.**

  ```ts
  // Correct: type derived from schema
  export type ConnectorConfig = z.infer<typeof ConnectorConfigSchema>

  // Correct: interface for a component/hook contract
  interface ConnectorConfigContextValue {
    config: ConnectorConfig
    updateMeta: (meta: Partial<Meta>) => void
  }
  ```

- **Never write a type that duplicates an existing schema.** If a Zod schema exists, derive the type from it with `z.infer<>`.

- **Prefix type-only imports with `type`** to respect `verbatimModuleSyntax`.

  ```ts
  import type { ConnectorConfig } from "@/lib/schemas"
  ```

- **Avoid `any`.** Use `unknown` for untyped external data and narrow before use.

- **Do not suppress TypeScript errors** with `// @ts-ignore` or `// @ts-expect-error` unless accompanied by a comment explaining why it is unavoidable.

---

## React Components

- **All components are function components.** No class components.

- **Use `import * as React from "react"`** — not the default import.

  ```ts
  // Correct
  import * as React from "react"

  // Wrong
  import React from "react"
  ```

- **Use `React.forwardRef` for any component that needs to expose a DOM node** (all `ui/` primitives).

  ```tsx
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, ...props }, ref) => (
      <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
    )
  )
  Button.displayName = "Button"
  ```

- **One component per file.** The filename must match the exported component name.

- **All form inputs are controlled.** Pass `value` and `onChange` explicitly; never use uncontrolled inputs.

- **Use `React.useCallback` for callbacks passed to custom components or that appear in `useEffect`/`useMemo` dependency arrays.** Inline anonymous functions on native HTML elements (`<input onChange>`, `<button onClick>`) do not cause child re-renders and do not need wrapping. The rule targets custom components that may be or become memoized.

  ```tsx
  // Correct: stable callback passed to a custom component
  const handleColumnsChange = React.useCallback(
    (columns: Column[]) => updateSchema({ columns }),
    [updateSchema]
  )
  <SchemaEditor columns={schema.columns} onChange={handleColumnsChange} />

  // Correct: inline on a native element — no wrapping needed
  <input onChange={e => updateMeta({ title: e.target.value })} />

  // Wrong: inline passed to a custom component
  <SchemaEditor onChange={columns => updateSchema({ columns })} />
  ```

- **No prop drilling past two levels.** If a value is needed more than two components deep, lift it into Context.

---

## Hooks

- **Custom hooks live in `src/hooks/`.** Each hook gets its own file.

- **Hook files use `.tsx` extension** when they include JSX (e.g., a Provider component), `.ts` otherwise.

- **Always guard Context hooks.** A custom hook that reads from Context must throw if used outside its provider.

  ```ts
  export function useConnectorConfig() {
    const context = React.useContext(ConnectorConfigContext)
    if (!context) {
      throw new Error("useConnectorConfig must be used within ConnectorConfigProvider")
    }
    return context
  }
  ```

- **Expose a safe default** for Context values that have a sensible fallback (e.g., theme).

  ```ts
  const ThemeContext = React.createContext<ThemeContextValue>({
    theme: "dark",
    toggleTheme: () => {},
  })
  ```

- **Memoize the context value** with `React.useMemo` to prevent unnecessary re-renders of all consumers.

  ```ts
  const value = React.useMemo(() => ({ config, updateMeta, reset }), [config])
  ```

---

## State Management

- **Use React Context for global/shared state.** This project does not use an external state library.

- **Provide granular update functions** instead of exposing a single `setState`. Each logical slice of the config has its own updater (`updateMeta`, `updateSchema`, `updateDataFlow`, etc.).

  ```ts
  function updateMeta(partial: Partial<Meta>) {
    setConfig(prev => ({ ...prev, meta: { ...prev.meta, ...partial } }))
  }
  ```

- **All state updates are immutable.** Use spread or `structuredClone` — never mutate state directly.

- **UI-only state** (open/closed, active tab, current step) belongs in local `React.useState` inside the component that owns it. Do not put it in Context.

- **Persisted state is debounced.** Any write to `localStorage` uses the debounced save function in `src/lib/persistence.ts`. Do not call `localStorage` directly from components.

---

## Validation & Schemas

- **All schemas are defined in `src/lib/schemas.ts`.** Do not define ad-hoc validation elsewhere.

- **Two-tier schema pattern:**
  - *Lenient schemas* (e.g., `MetaSchema`) are used for internal state and localStorage. They provide default values for all fields and tolerate empty strings.
  - *Strict validation schemas* (e.g., `MetaValidation`) are used for step-gating and user-facing validation. They carry descriptive error messages.

  ```ts
  // Lenient — for state
  export const MetaSchema = z.object({
    connectorId: z.string().default(""),
    title: z.string().default(""),
  })

  // Strict — for step gate
  export const MetaValidation = z.object({
    connectorId: z.string()
      .min(3, "Connector ID must be at least 3 characters")
      .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Must start with a letter, alphanumeric only"),
    title: z.string().min(1, "Title is required"),
  })
  ```

- **Always derive types from schemas with `z.infer<>`.** Never write a manually declared type that mirrors a schema.

- **Enum values come from `as const` arrays**, not from `z.enum()` constructed inline, so they can be iterated in the UI.

  ```ts
  export const columnTypes = ["string", "int", "long", "real", "bool", "datetime", "dynamic", "guid"] as const
  export type ColumnType = typeof columnTypes[number]
  export const ColumnSchema = z.object({ name: z.string(), type: z.enum(columnTypes) })
  ```

---

## Styling

- **Tailwind CSS is the only styling mechanism.** No CSS modules, no inline `style` objects (except for genuinely dynamic values that cannot be expressed as Tailwind classes).

- **Use `cn()` from `src/lib/utils.ts`** whenever combining conditional or external classes. It resolves Tailwind class conflicts correctly via `tailwind-merge`.

  ```tsx
  className={cn("base-class other-class", isActive && "active-class", className)}
  ```

- **Use Class Variance Authority (CVA) for components that have multiple visual variants** (size, intent, state). Define variants once in the component file.

  ```ts
  const buttonVariants = cva("base-classes", {
    variants: {
      variant: { default: "...", destructive: "...", outline: "..." },
      size: { default: "...", sm: "...", lg: "..." },
    },
    defaultVariants: { variant: "default", size: "default" },
  })
  ```

- **Spread `className` as the last prop** so callers can override styles cleanly.

  ```tsx
  <div className={cn("grid gap-2", className)} {...props} />
  ```

- **Do not hardcode colors.** Use design tokens (`text-muted-foreground`, `bg-primary`, `border-destructive`, etc.) defined in the Tailwind config.

---

## File & Folder Structure

```
src/
├── components/
│   ├── ui/               # Primitive, reusable UI components (shadcn-style)
│   ├── wizard/           # Multi-step wizard screens
│   ├── preview/          # Live template preview
│   ├── schema-editor/    # Column/schema editing UI
│   ├── kql-editor/       # KQL transform editor
│   └── instruction-editor/
├── hooks/                # Custom React hooks + Context providers
├── lib/
│   ├── arm-resources/    # Individual ARM resource generators
│   ├── schemas.ts        # All Zod schemas and inferred types
│   ├── defaults.ts       # Default value generators
│   ├── naming.ts         # Name derivation utilities
│   ├── download.ts       # File download / ZIP export
│   ├── persistence.ts    # localStorage read/write
│   ├── json-inferrer.ts  # JSON → schema inference
│   └── utils.ts          # cn() and other pure utilities
├── routes/               # TanStack Router file-based routes
├── router.tsx            # Router factory
└── routeTree.gen.ts      # Auto-generated — do not edit
```

- **Do not place business logic in components.** Computation, derivation, and data transformation live in `src/lib/`.
- **Do not place UI concerns in `src/lib/`.** Library functions return plain data — never JSX.
- **`src/components/ui/`** contains only generic, project-agnostic primitives. Domain-specific components go in feature subdirectories.

---

## Imports

**Order (top to bottom):**

1. `import * as React from "react"` — always first
2. Type-only imports (`import type { ... }`)
3. Third-party library imports
4. Internal imports using the `@/` alias (cross-module)
5. Relative imports (same directory or subdirectory)

```ts
import * as React from "react"
import type { Column } from "@/lib/schemas"
import { z } from "zod"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { cn } from "@/lib/utils"
import { SchemaEditor } from "./SchemaEditor"
```

- **Always use the `@/` alias for cross-module imports.** Never use `../../` to escape the current feature directory.
- **Use relative imports** only within the same feature directory.
- **Group related imports** on adjacent lines; separate groups with a blank line only when it aids clarity.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase | `StepBasics.tsx` |
| Component export | PascalCase | `export function StepBasics()` |
| Hook file | camelCase | `useConnectorConfig.tsx` |
| Hook export | camelCase, `use` prefix | `export function useConnectorConfig()` |
| Lib/utility file | camelCase | `naming.ts`, `arm-generator.ts` |
| Utility function | camelCase | `connectorIdToDcrName()` |
| Zod lenient schema | PascalCase + `Schema` | `MetaSchema` |
| Zod strict schema | PascalCase + `Validation` | `MetaValidation` |
| Inferred type | PascalCase | `type Meta = z.infer<typeof MetaSchema>` |
| Context object | PascalCase + `Context` | `ConnectorConfigContext` |
| Context value type | PascalCase + `ContextValue` | `ConnectorConfigContextValue` |
| Boolean variables/props | `is`, `has`, `can`, `should` prefix | `isPreview`, `hasError` |
| Event handlers | `handle` prefix | `handleCopy`, `handleStepChange` |

---

## Error Handling

- **Throw descriptive errors for programming mistakes** (hook used outside provider, invalid arguments). These are not caught — they appear in development as unhandled exceptions.

- **Silently ignore expected environmental failures** (localStorage full/unavailable, clipboard API unavailable). Wrap with `try/catch` and do nothing in the catch block; add a comment explaining why.

  ```ts
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard API unavailable in some contexts — no-op
  }
  ```

- **Use Zod for all user-facing validation.** Do not write manual validation logic for form fields; express constraints in the Zod strict schemas.

- **Never swallow errors in business logic.** If an ARM generator or download function throws, let it propagate so it surfaces in the UI's error boundary (or the preview's catch block).

- **Communicate validation errors through state**, not through thrown exceptions. Parse with `.safeParse()` and derive error messages from the `error.issues` array.

  ```ts
  const result = MetaValidation.safeParse(config.meta)
  const isValid = result.success
  const errors = result.success ? {} : Object.fromEntries(
    result.error.issues.map(i => [i.path[0], i.message])
  )
  ```

---

## TanStack Router

- **Routes are file-based.** Create a new file under `src/routes/` to add a route; never register routes manually.

- **`routeTree.gen.ts` is auto-generated** by the TanStack Start plugin. Do not edit it manually.

- **Declare the router type** so all navigation calls and `useParams` calls are type-safe.

  ```ts
  declare module "@tanstack/react-router" {
    interface Register {
      router: ReturnType<typeof getRouter>
    }
  }
  ```

- **Route-level data loading** (loaders) is preferred over `useEffect` + `useState` for data that should be available before the component renders.

---

## ARM Resource Generators

Each file in `src/lib/arm-resources/` generates a single Azure resource object. These rules apply:

- **One resource type per file.** `table.ts` → table, `dcr.ts` → DCR, etc.
- **Functions are pure.** They take config values as arguments and return a plain object. No side effects, no I/O.
- **Individual resource files must not contain ARM template constructs** (`scope`, `dependsOn`, ARM expression functions like `resourceId()` or `reference()`). Those constructs belong in the compiled `mainTemplate.json` produced by Microsoft's packaging script. Parameter references (`[parameters('...')]`) and variable references (`[variables('...')]`) are allowed because they are resolved at deployment time.
- **API versions must match the official Microsoft documentation.** When updating, include the docs URL in a comment.

  ```ts
  // https://learn.microsoft.com/en-us/azure/sentinel/create-push-codeless-connector
  apiVersion: "2021-09-01-preview",
  ```

- **Field order in returned objects should match the documentation examples** for easier cross-referencing: `name`, `apiVersion`, `type`, `location`, `kind`, `properties`.

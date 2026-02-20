# Sentinel Connector Studio — Specification

## Overview

A client-side web application that guides users through visually building a Microsoft Sentinel Codeless Connector Framework (CCF) push connector. The tool produces a deployable ARM template (`mainTemplate.json`) that can be deployed directly to Azure via the portal, CLI, or API.

The target audience spans both **ISV developers** (building connectors for their products) and **security engineers** (pushing data from internal tools into Sentinel). The UX must assume the user has never worked with Sentinel, ARM templates, or DCRs before.

## Tech Stack

- **TanStack Start** — full-stack React framework (used in SPA/client-only mode)
- **TanStack Router** — file-based routing with type-safe navigation
- **TanStack Form** — form state management with validation
- **TypeScript** — strict mode throughout
- **Tailwind CSS v4** + **shadcn/ui** — styling and component library
- **Zod** — schema validation for all connector data structures
- **Client-side only** — no backend; all generation happens in the browser. Deployable as a static site (e.g., GitHub Pages, Azure Static Web Apps, Vercel).

## Architecture

### Core Concept: Wizard with Live Preview

The application is structured as a **multi-step wizard** with a persistent **live ARM template preview panel**. Each step collects a focused slice of the connector configuration, validates it, and updates the preview in real time.

```
┌──────────────────────────────────────────────────────┐
│  Header / Stepper (Step 1 → 2 → 3 → 4 → 5)         │
├──────────────────────┬───────────────────────────────┤
│                      │                               │
│   Wizard Form Panel  │   Live Preview Panel          │
│   (left, ~60%)       │   (right, ~40%)               │
│                      │   - ARM template JSON         │
│   • Form fields      │   - Syntax highlighted        │
│   • Contextual help  │   - Collapsible sections      │
│   • Inline validation│   - Copy button               │
│                      │   - Download button            │
│                      │                               │
├──────────────────────┴───────────────────────────────┤
│  Navigation: [Back]                    [Next / Save] │
└──────────────────────────────────────────────────────┘
```

On smaller viewports, the preview panel collapses to a toggleable drawer.

### Application State

A single Zod-validated state object (`ConnectorConfig`) holds the entire connector definition. Each wizard step reads/writes to a slice of this object. The state is persisted to `localStorage` so users can resume work across sessions.

```
ConnectorConfig
├── meta                 (Step 1: Basics)
│   ├── connectorId
│   ├── title
│   ├── publisher
│   ├── descriptionMarkdown
│   └── logo (SVG string, optional)
├── schema               (Step 2: Table Schema)
│   ├── tableName
│   └── columns[]
│       ├── name
│       └── type (enum: string | int | long | real | bool | datetime | dynamic | guid)
├── dataFlow             (Step 3: Data Collection Rule)
│   ├── streamName       (auto-derived from tableName, editable)
│   ├── transformKql     (default: "source | extend TimeGenerated = now()")
│   └── columns[]        (auto-copied from schema, user can override for input-only fields)
├── connectorUI          (Step 4: Connector Page)
│   ├── graphQueries[]
│   ├── sampleQueries[]
│   ├── connectivityCriteria
│   ├── permissions
│   └── instructionSteps[]
└── solution             (Step 5: Solution Metadata)
    ├── publisherId
    ├── offerId
    ├── version
    ├── categories[]
    └── support
```

---

## Wizard Steps

### Step 1: Connector Basics

**Purpose:** Capture identity and branding information.

| Field | Type | Required | Notes |
|---|---|---|---|
| Connector ID | text | yes | Auto-generated from title (kebab-case), editable. Used as resource name. Must be unique. |
| Title | text | yes | Display name in the Sentinel data connector gallery. e.g., "Contoso Security Alerts (Push)" |
| Publisher | text | yes | Company or author name |
| Description | markdown editor | yes | Supports markdown. Shown on the connector page in Sentinel. Provide a placeholder template. |
| Logo | SVG upload or paste | no | Optional SVG for the connector gallery tile. Show a preview. |

**Guidance panel (sidebar or tooltip):**
- Explain what the connector gallery looks like with a screenshot/mockup.
- "The title is what users see when browsing connectors in Sentinel."
- "The description supports Markdown — link to your product docs."

---

### Step 2: Table Schema

**Purpose:** Define the custom Log Analytics table where ingested data will be stored.

**UX: Interactive column editor**

- Starts with a `TimeGenerated` (datetime) column that is locked/non-removable (required by Sentinel).
- User adds columns via an "Add Column" button.
- Each column row: `[Name (text input)] [Type (dropdown)] [Remove button]`
- Column types: `string`, `int`, `long`, `real`, `bool`, `datetime`, `dynamic`, `guid`
- Table name is auto-derived: `{ConnectorId}_CL` — editable, but must end with `_CL`.

**Alternative input: paste JSON schema**
- A "Paste sample event" button allows the user to paste a sample JSON event (like the one their application would send). The app infers column names and types from the JSON structure and populates the column editor automatically.
- Type inference rules:
  - String → `string`
  - Number (integer) → `long`
  - Number (float) → `real`
  - Boolean → `bool`
  - ISO 8601 datetime string → `datetime`
  - Object/Array → `dynamic`
- The user can review and adjust inferred types before proceeding.

**Validation:**
- Column names must be unique, non-empty, no spaces (PascalCase recommended).
- At least one column beyond `TimeGenerated`.
- Table name must end with `_CL`.

**Guidance:**
- "This table is where your data lands in Log Analytics. Think of columns as the fields in your events."
- "Tip: Paste a sample JSON event from your application to auto-generate the schema."
- Explain each column type briefly in the dropdown or via a tooltip.

---

### Step 3: Data Collection Rule (DCR)

**Purpose:** Configure how data flows from the push endpoint to the table.

**Auto-populated from Step 2:**
- Stream name: `Custom-{tableName without _CL}` (editable)
- Input stream columns: copied from table schema (minus `TimeGenerated` if the user wants it auto-added via KQL)

**User-configurable:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Stream name | text | yes | Auto-derived, must start with `Custom-` |
| Transform KQL | code editor | yes | Default: `source \| extend TimeGenerated = now()`. Syntax-highlighted KQL editor. |
| Input columns differ from table? | toggle | no | If enabled, lets the user define a different input schema (e.g., the app sends `timestamp` but the table has `TimeGenerated`). The KQL transform handles the mapping. |

**KQL Transform Editor:**
- A small code editor (Monaco or CodeMirror) with KQL syntax highlighting.
- Pre-populated with `source | extend TimeGenerated = now()`.
- Show a help panel explaining:
  - `source` refers to the incoming data stream
  - Common patterns: `extend`, `project`, `where` for filtering
  - The transform must produce columns matching the output table schema
- Provide template snippets the user can insert:
  - "Pass through" → `source`
  - "Add TimeGenerated" → `source | extend TimeGenerated = now()`
  - "Rename field" → `source | extend TimeGenerated = todatetime(timestamp) | project-away timestamp`

**Guidance:**
- "The DCR acts as a pipeline: data comes in from your app, gets transformed, and lands in the table."
- "If your app already sends a `TimeGenerated` field, use `source` as the transform. Otherwise, the default adds it automatically."

---

### Step 4: Connector Page Configuration

**Purpose:** Configure the Sentinel connector page UX — what users see when they open the connector in the Sentinel portal.

This step has three sub-sections:

#### 4a. Queries

- **Graph queries** (metrics shown on the connector page):
  - Auto-generated: one query per table. User can add more.
  - Fields: `metricName`, `legend`, `baseQuery`
- **Sample queries** (shown in the "Next steps" section):
  - User adds query entries: `description` + `query` (KQL editor)
  - Pre-populate with two examples based on the table schema:
    1. "All events" → `{tableName} | sort by TimeGenerated desc`
    2. Auto-generated filter based on a string column (if any)

#### 4b. Connectivity & Permissions

- **Connectivity criteria:** auto-generated `IsConnectedQuery` using the table name. Editable.
- **Permissions:** pre-filled with the standard workspace + Entra + Azure RBAC permissions. User can add custom permission entries.

#### 4c. Instruction Steps

- The instruction steps are **auto-generated** with sensible defaults:
  1. Deploy step with `DeployPushConnectorButton`
  2. Configuration step with `CopyableLabel` fields for all connection details (TenantId, ApplicationId, ApplicationSecret, DataCollectionEndpoint, DataCollectionRuleId, StreamName)
- User can:
  - Edit the markdown content in each step
  - Add additional instruction steps (e.g., "Configure firewall rules")
  - Reorder steps via drag-and-drop
  - Add additional `Markdown` instruction blocks

**Guidance:**
- "This is what your users see after they install the connector in Sentinel."
- Show a mockup/preview of what the connector page looks like in the Sentinel portal.

---

### Step 5: Solution Metadata & Export

**Purpose:** Finalize solution packaging metadata and download the output.

| Field | Type | Required | Notes |
|---|---|---|---|
| Publisher ID | text | yes | Lowercase, no spaces. Used for Content Hub. |
| Offer ID | text | yes | Lowercase with hyphens. Must be globally unique in Content Hub. |
| Version | text | yes | Semver format. Default: `1.0.0` |
| Categories | multi-select | yes | Options from Sentinel's category taxonomy: "Security - Threat Protection", "Security - Cloud Security", "Security - Automation (SOAR)", etc. |
| Support name | text | yes | Company/team providing support |
| Support tier | select | yes | "Microsoft" / "Partner" / "Community" |
| Support link | url | yes | URL to support page |
| First publish date | date | yes | Default: today |

**Output section:**

Three download options as buttons:

1. **Download ARM Template** (`mainTemplate.json`)
   - The primary output. A single ARM template file that includes all resources: custom table, DCR, connector definition, and data connector.
   - Ready to deploy via Azure Portal "Deploy a custom template", Azure CLI, or PowerShell.

2. **Download Solution Package** (ZIP)
   - The full folder structure expected by the Azure-Sentinel packaging tool:
     ```
     {ConnectorName}/
     ├── Data/
     │   └── Solution_{ConnectorName}.json
     ├── SolutionMetadata.json
     ├── ReleaseNotes.md
     └── Data Connectors/
         └── {ConnectorName}_ccf/
             ├── table.json
             ├── DCR.json
             ├── connectorDefinition.json
             └── dataConnector.json
     ```

3. **Download Individual Files** (expandable section)
   - Each JSON artifact individually downloadable for inspection or manual integration.

**Post-download guidance:**
- Clear instructions for each deployment path:
  - "Deploy via Azure Portal" → step-by-step with portal link
  - "Deploy via Azure CLI" → `az deployment group create` command, pre-filled with resource names
  - "After deployment" → how to find the connector in Sentinel, click Deploy, and copy credentials

---

## ARM Template Generation

The core engine of the app. Produces a valid ARM template from the `ConnectorConfig` state.

### Template Structure

The generated `mainTemplate.json` follows the Azure-Sentinel solution pattern:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "workspace": { "type": "string" },
    "workspace-location": { "type": "string" },
    "subscription": { "type": "string", "defaultValue": "[subscription().subscriptionId]" },
    "resourceGroupName": { "type": "string", "defaultValue": "[resourceGroup().name]" }
  },
  "variables": {
    "workspaceResourceId": "[resourceId('Microsoft.OperationalInsights/workspaces', parameters('workspace'))]"
  },
  "resources": [
    /* 1. Custom table definition */
    /* 2. Data Collection Rule */
    /* 3. Connector Definition (UI) */
    /* 4. Data Connector (Push config) */
  ]
}
```

### Generation Rules

1. **Table resource:** Built from `schema.tableName` and `schema.columns`. API version `2025-07-01`.
2. **DCR resource:** Built from `dataFlow`. Stream declarations from input columns, data flows with transform KQL. References workspace and DCE via parameters.
3. **Connector definition resource:** Built from `meta` + `connectorUI`. Includes all UI config, queries, permissions, instruction steps.
4. **Data connector resource:** Links connector definition to DCR config. Uses `[[parameters(...)` escape syntax for ARM nested template parameters.

### Naming Conventions (enforced automatically)

| Artifact | Pattern | Example |
|---|---|---|
| Table name | `{Name}_CL` | `ContosoSecurityAlerts_CL` |
| Stream name | `Custom-{Name}` | `Custom-ContosoSecurityAlerts` |
| Output stream | `Custom-{Name}_CL` | `Custom-ContosoSecurityAlerts_CL` |
| DCR name | `{Name}PushDCR` | `ContosoSecurityAlertsPushDCR` |
| Connector def name | `{Name}Push` | `ContosoSecurityAlertsPush` |
| Connector config name | `{Name}PushConnector` | `ContosoSecurityAlertsPushConnector` |

---

## UX Design Principles

### 1. Progressive Disclosure
- Each step shows only what's needed. Advanced options (custom permissions, KQL transforms, input schema overrides) are hidden behind toggles or "Advanced" sections.
- Defaults are always provided — a user can click through with minimal input and get a working connector.

### 2. Contextual Guidance
- Every form section has a collapsible "What is this?" help block that explains the concept in plain language, not Azure jargon.
- Use concrete examples: "If your app sends `{ severity: 'high', message: '...' }`, you'd add two columns: `Severity (string)` and `Message (string)`."
- Link to relevant Microsoft docs for deep dives, but never require the user to leave the app to proceed.

### 3. Smart Defaults
- Table name auto-derived from connector title.
- Stream name auto-derived from table name.
- KQL transform defaults to `source | extend TimeGenerated = now()`.
- Connectivity query, permissions, and instruction steps are all auto-generated.
- Sample queries are generated from the schema.

### 4. Instant Feedback
- The live preview panel updates on every keystroke.
- Validation errors appear inline, not in a modal or toast.
- The stepper shows green checkmarks for completed/valid steps and red indicators for steps with errors.

### 5. Error Prevention
- Naming constraints are enforced as-you-type (no spaces in column names, `_CL` suffix on table name, `Custom-` prefix on stream name).
- The "Paste sample event" feature eliminates manual column entry errors.
- ARM template output is generated from typed structures, not string concatenation — preventing malformed JSON.

---

## Key Components

### `ConnectorWizard`
Top-level layout: stepper, form panel, preview panel, navigation.

### `SchemaEditor`
The interactive column table with add/remove/reorder. Includes the "Paste JSON" modal.

### `KqlEditor`
Code editor for KQL transforms with syntax highlighting and snippet insertion.

### `InstructionStepEditor`
WYSIWYG-ish editor for the connector page instruction steps. Drag-and-drop reordering.

### `ArmTemplatePreview`
Syntax-highlighted, collapsible JSON viewer. Sections map to resources. Copy and download buttons.

### `ArmTemplateGenerator`
Pure function: `(config: ConnectorConfig) => ArmTemplate`. No side effects. Fully testable. This is the core logic of the application.

---

## Validation (Zod Schemas)

All validation is defined as Zod schemas that serve triple duty:
1. **TypeScript types** — inferred from schemas
2. **Form validation** — used by TanStack Form
3. **Structural correctness** — ensures the generated ARM template is valid

Key validation rules:
- `connectorId`: `^[a-zA-Z][a-zA-Z0-9]*$`, min 3 chars
- `tableName`: must end with `_CL`, no spaces
- `columns[].name`: `^[a-zA-Z_][a-zA-Z0-9_]*$`, unique within table
- `columns[].type`: enum of valid Log Analytics types
- `streamName`: must start with `Custom-`
- `version`: valid semver
- `publisherId`: lowercase alphanumeric
- `offerId`: lowercase alphanumeric with hyphens

---

## Persistence

- `ConnectorConfig` state is serialized to `localStorage` on every change (debounced).
- On load, the app checks for saved state and offers to resume or start fresh.
- A "Reset" button clears all saved state with a confirmation dialog.
- Import/export of the `ConnectorConfig` as JSON for sharing between team members.

---

## Future Considerations (Out of Scope for v1)

These are explicitly **not** part of the initial build but inform architectural decisions:

- **Azure integration:** Authenticate with Azure and deploy the ARM template directly from the app.
- **Pull connector support:** Extend the wizard to also support CCF pull (polling) connectors.
- **Template gallery:** Pre-built connector templates for common use cases (syslog, webhook, etc.).
- **Connector testing:** Built-in test panel that sends sample events to a deployed connector.
- **Collaboration:** Share connector configs via URL (encoded in fragment or via a simple backend).

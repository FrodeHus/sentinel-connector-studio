# Sentinel Connector Studio

[![CI](https://github.com/FrodeHus/sentinel-connector-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/FrodeHus/sentinel-connector-studio/actions/workflows/ci.yml)
[![Docker Publish](https://github.com/FrodeHus/sentinel-connector-studio/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/FrodeHus/sentinel-connector-studio/actions/workflows/docker-publish.yml)

A client-side web application that guides you through visually building a **Microsoft Sentinel Codeless Connector Framework (CCF) connector** (Push or RestApiPoller), complete with analytic rules, hunting queries, ASIM parsers, and workbooks. The tool produces a deployable ARM template (`mainTemplate.json`) that can be deployed directly to Azure via the portal, CLI, or API.

No backend required — everything runs in the browser and can be deployed as a static site (GitHub Pages, Azure Static Web Apps, Vercel, etc.).

## Who is this for?

- **ISV developers** building data connectors for their products
- **Security engineers** pushing data from internal tools into Microsoft Sentinel

The UX is designed for users who may have no prior experience with ARM templates, Data Collection Rules, or Sentinel connector definitions.

## Features

- **Guided multi-step wizard** — walks you through each part of the connector configuration
- **Push and Pull connectors** — build Push (CCF) or RestApiPoller connectors
- **Live ARM template preview** — see the generated template update in real time as you fill out the form
- **JSON schema inference** — paste a sample JSON event and the app auto-generates the table schema
- **KQL transform editor** — syntax-highlighted editor with template snippets for common patterns
- **Analytic rules** — define [Scheduled and NRT analytic rules](https://learn.microsoft.com/en-us/azure/sentinel/create-analytics-rules) with entity mappings, MITRE ATT&CK tactics, and custom KQL queries
- **Hunting queries** — define [hunting queries](https://learn.microsoft.com/en-us/azure/sentinel/sentinel-hunting-rules-creation) with KQL, MITRE ATT&CK tactics/techniques, and required data connectors
- **ASIM parsers** — create [Advanced Security Information Model (ASIM) parsers](https://learn.microsoft.com/en-us/azure/sentinel/normalization-develop-parsers) to normalize your connector's data into standard schemas
- **Workbooks** — include [Azure Monitor Workbooks](https://learn.microsoft.com/en-us/azure/sentinel/monitor-your-data) by pasting gallery template JSON exported from the Azure portal
- **Resizable KQL editor** — vertically resizable code editor with an expand-to-dialog button for comfortable editing of large queries
- **Smart defaults** — table names, stream names, connectivity queries, permissions, and instruction steps are all auto-generated
- **Session persistence** — your work is saved to `localStorage` so you can resume across sessions
- **Save / Load projects** — export your project as a `.json` file, reload it later, or load from a URL
- **Multiple export options** — download the ARM template, a full solution package (ZIP), or individual resource files
- **Packager sidecar** — optional Docker container that runs `createSolutionV3.ps1` automatically to produce a deployable ARM template
- **Deep link support** — link directly to a project via URL query parameter (`?project=<url>`)

## Share Your Connector

You can add a badge to your repository's README that opens your connector project directly in Sentinel Connector Studio. When someone clicks the badge, the app loads and automatically imports the project file from the URL.

### Badge

[![Open in Sentinel Connector Studio](https://connector-studio.reothor.no/badge.svg)](https://connector-studio.reothor.no/)

### Usage

Add the following markdown to your README, replacing `<URL_TO_PROJECT_JSON>` with a direct link to your exported `.json` project file (e.g. a raw GitHub URL):

```markdown
[![Open in Sentinel Connector Studio](https://connector-studio.reothor.no/badge.svg)](https://connector-studio.reothor.no/?project=<URL_TO_PROJECT_JSON>)
```

**Example** using a raw GitHub URL:

```markdown
[![Open in Sentinel Connector Studio](https://connector-studio.reothor.no/badge.svg)](https://connector-studio.reothor.no/?project=https://raw.githubusercontent.com/myorg/myrepo/main/connector.json)
```

> **Note:** The project URL must serve valid JSON with the correct CORS headers. Raw GitHub URLs (`raw.githubusercontent.com`) work out of the box.

## Wizard Steps

1. **Basics** — Connector identity and branding (title, publisher, description, optional SVG logo)
2. **Table Schema** — Define the custom Log Analytics table columns (or paste a sample JSON event to auto-generate)
3. **Data Collection Rule** — Configure the data flow, stream name, and KQL transform
4. **Connector UI** — Set up the Sentinel connector page: graph queries, sample queries, permissions, and instruction steps
5. **Content** — Define solution-level content in four tabs:
   - **Analytic Rules** — Scheduled or NRT detection rules with KQL queries, entity mappings, and MITRE ATT&CK tactics
   - **Hunting Queries** — Proactive hunt queries with KQL, MITRE ATT&CK context, and required data connectors
   - **ASIM Parsers** — Parsers that normalize your connector's data into standard ASIM schemas
   - **Workbooks** — Interactive Azure Monitor dashboards imported from gallery template JSON
6. **Export** — Finalize solution metadata and download the ARM template or solution package

## Learn More

- [Create a codeless connector for Microsoft Sentinel (Push)](https://learn.microsoft.com/en-us/azure/sentinel/create-push-codeless-connector) — official guide for Push CCF connectors
- [Create custom analytics rules](https://learn.microsoft.com/en-us/azure/sentinel/create-analytics-rules) — scheduled and NRT rule authoring
- [Create hunting queries](https://learn.microsoft.com/en-us/azure/sentinel/sentinel-hunting-rules-creation) — proactive hunt query authoring and schema
- [Develop ASIM parsers](https://learn.microsoft.com/en-us/azure/sentinel/normalization-develop-parsers) — building parsers that map data to the Advanced Security Information Model
- [ASIM schemas overview](https://learn.microsoft.com/en-us/azure/sentinel/normalization-about-schemas) — available ASIM schemas and their fields
- [Azure Monitor Workbooks](https://learn.microsoft.com/en-us/azure/sentinel/monitor-your-data) — creating interactive dashboards for Sentinel solutions

## Packager Sidecar

The project includes an optional **packager sidecar** — a Docker container that runs the official Azure-Sentinel `createSolutionV3.ps1` script automatically. When the packager is running, the Export step offers a **Build Deployable Template** button that produces a ready-to-deploy `mainTemplate.json` without any local tooling.

### How it works

1. The app sends your solution ZIP to the packager sidecar (port 8081)
2. The sidecar runs `createSolutionV3.ps1` inside a PowerShell container
3. You get back a `deployable-template.zip` containing the generated `Package/mainTemplate.json`

### Running the packager

Start both the app and the packager together:

```bash
docker compose up
```

Or start the packager alongside a local dev server:

```bash
docker compose up packager
pnpm dev
```

The Export step shows a **Packager Online** / **Packager Offline** badge so you always know if the sidecar is reachable. When offline, you can still download the raw solution package and run `createSolutionV3.ps1` manually.

### Deploying the generated template

After building or packaging your template, the Next Steps section provides both a **Portal** and **CLI** deployment guide.

**Azure Portal:**

1. Navigate to [Deploy a custom template](https://portal.azure.com/#create/Microsoft.Template)
2. Click "Build your own template in the editor"
3. Upload `Package/mainTemplate.json`
4. Select your subscription, resource group, and workspace
5. Review and create

**Azure CLI:**

```bash
az login

az group create \
  --name <RESOURCE_GROUP> \
  --location <LOCATION>

az deployment group create \
  --resource-group <RESOURCE_GROUP> \
  --template-file Package/mainTemplate.json \
  --parameters workspace=<WORKSPACE_NAME>
```

The `workspace` parameter is required and must be supplied using the `--parameters` option as shown above.

## Getting Started

### Docker Quickstart

Pull and run the latest image from Docker Hub:

```bash
docker pull frodehus/sentinel-connector-studio
docker run -p 8080:8080 frodehus/sentinel-connector-studio
```

Open `http://localhost:8080` in your browser.

To pin a specific version:

```bash
docker run -p 8080:8080 frodehus/sentinel-connector-studio:1.3.0
```

> See all available tags at [hub.docker.com/r/frodehus/sentinel-connector-studio](https://hub.docker.com/r/frodehus/sentinel-connector-studio).

#### Running with the packager sidecar (Docker Hub images)

To run both the studio and the packager using pre-built images from Docker Hub, copy the example env file and start the stack:

```bash
cp .env.example .env
docker compose up
```

The `.env` file pins the image versions. To upgrade to a newer release, update the version tags in `.env` and pull:

```bash
docker compose pull
docker compose up
```

You can also run only the packager alongside a local dev server:

```bash
docker compose up packager
pnpm dev
```

> See all available packager tags at [hub.docker.com/r/frodehus/sentinel-connector-studio-packager](https://hub.docker.com/r/frodehus/sentinel-connector-studio-packager).

#### Building from source

If you prefer to build the images locally (e.g. for development), remove or omit the `.env` file and pass `--build`:

```bash
docker compose up --build
```

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

### Install and run

```bash
pnpm install
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Build for production

```bash
pnpm build
```

### Run tests

```bash
pnpm test
```

### Lint

```bash
pnpm run lint
```

## Tech Stack

- [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router) — SPA framework with file-based routing
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — styling and component library
- [Zod](https://zod.dev/) — schema validation for all connector data structures
- [CodeMirror](https://codemirror.net/) — KQL transform editor
- [JSZip](https://stuk.github.io/jszip/) — solution package ZIP generation
- [ESLint](https://eslint.org/) — linting with TypeScript, React Hooks, and React Refresh plugins
- [Trivy](https://trivy.dev/) — Docker image vulnerability scanning in CI

## Project Structure

```text
src/
├── components/
│   ├── wizard/           # Wizard steps and navigation
│   │   └── content/      # Content editors (analytic rules, hunting queries, ASIM parsers, workbooks)
│   ├── schema-editor/    # Interactive column editor + paste-JSON dialog
│   ├── kql-editor/       # Resizable KQL editor with expand-to-dialog
│   ├── instruction-editor/ # Connector page instruction step editor
│   ├── preview/          # Live ARM/YAML/JSON preview panels
│   └── ui/               # Reusable UI primitives (shadcn/ui)
├── hooks/                # React hooks (connector config state, theme)
├── lib/                  # Pure logic — ARM resource generators, naming, schemas, utilities
│   └── arm-resources/    # Individual ARM resource builders (table, DCR, connector def, data connector)
└── routes/               # TanStack Router file-based routes
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards and conventions.

## License

See the repository for license details.

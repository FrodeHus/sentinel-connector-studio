# Sentinel Connector Studio
[![CI](https://github.com/FrodeHus/sentinel-ccf-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/FrodeHus/sentinel-ccf-builder/actions/workflows/ci.yml)

A client-side web application that guides you through visually building a **Microsoft Sentinel Codeless Connector Framework (CCF) push connector**. The tool produces a deployable ARM template (`mainTemplate.json`) that can be deployed directly to Azure via the portal, CLI, or API.

No backend required — everything runs in the browser and can be deployed as a static site (GitHub Pages, Azure Static Web Apps, Vercel, etc.).

## Who is this for?

- **ISV developers** building data connectors for their products
- **Security engineers** pushing data from internal tools into Microsoft Sentinel

The UX is designed for users who may have no prior experience with ARM templates, Data Collection Rules, or Sentinel connector definitions.

## Features

- **Guided multi-step wizard** — walks you through each part of the connector configuration
- **Live ARM template preview** — see the generated template update in real time as you fill out the form
- **JSON schema inference** — paste a sample JSON event and the app auto-generates the table schema
- **KQL transform editor** — syntax-highlighted editor with template snippets for common patterns
- **Smart defaults** — table names, stream names, connectivity queries, permissions, and instruction steps are all auto-generated
- **Session persistence** — your work is saved to `localStorage` so you can resume across sessions
- **Multiple export options** — download the ARM template, a full solution package (ZIP), or individual resource files

## Wizard Steps

1. **Basics** — Connector identity and branding (title, publisher, description, optional SVG logo)
2. **Table Schema** — Define the custom Log Analytics table columns (or paste a sample JSON event to auto-generate)
3. **Data Collection Rule** — Configure the data flow, stream name, and KQL transform
4. **Connector UI** — Set up the Sentinel connector page: graph queries, sample queries, permissions, and instruction steps
5. **Export** — Finalize solution metadata and download the ARM template or solution package

## Getting Started

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

## Tech Stack

- [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router) — SPA framework with file-based routing
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — styling and component library
- [Zod](https://zod.dev/) — schema validation for all connector data structures
- [CodeMirror](https://codemirror.net/) — KQL transform editor
- [JSZip](https://stuk.github.io/jszip/) — solution package ZIP generation

## Project Structure

```
src/
├── components/
│   ├── wizard/           # Wizard steps and navigation
│   ├── schema-editor/    # Interactive column editor + paste-JSON dialog
│   ├── kql-editor/       # KQL transform code editor
│   ├── instruction-editor/ # Connector page instruction step editor
│   ├── preview/          # Live ARM template preview panel
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

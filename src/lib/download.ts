import { saveAs } from "file-saver"
import JSZip from "jszip"
import type { ConnectorConfig, AppState } from "./schemas";
import { generateTableResource } from "./arm-resources/table";
import { generateDcrResource } from "./arm-resources/dcr";
import { generateConnectorDefinition } from "./arm-resources/connector-def";
import { generateDataConnector } from "./arm-resources/data-connector";
import { connectorIdToDcrName } from "./naming";
import { generateAnalyticRuleYaml, generateAsimParserYaml } from "./content-export";

const PACKAGER_URL = import.meta.env.VITE_PACKAGER_URL || "/api/packager";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, filename);
}

export function downloadIndividualFile(
  type: "table" | "dcr" | "connectorDef" | "dataConnector",
  config: ConnectorConfig,
) {
  const { meta, schema, dataFlow, connectorUI } = config;
  const dcrName = connectorIdToDcrName(meta.connectorId, meta.connectorKind);

  switch (type) {
    case "table":
      downloadJson(generateTableResource(schema, ""), "table.json");
      break;
    case "dcr":
      downloadJson(generateDcrResource(schema, dataFlow, dcrName), "DCR.json");
      break;
    case "connectorDef":
      downloadJson(
        generateConnectorDefinition(meta, schema, connectorUI),
        "connectorDefinition.json",
      );
      break;
    case "dataConnector":
      downloadJson(generateDataConnector(meta, dataFlow, config.pollerConfig), "dataConnector.json");
      break;
  }
}

export async function buildSolutionZip(appState: AppState): Promise<Blob> {
  const { solution, connectors, analyticRules, asimParsers } = appState;
  const solutionName =
    solution.name || connectors[0]?.meta.connectorId || "MySolution";
  const zip = new JSZip();

  const root = zip.folder(solutionName)!;
  const dataConnectorsFolder = root.folder("Data Connectors")!;
  const connectorPaths: string[] = [];
  const analyticRulePaths: string[] = [];
  const parserPaths: string[] = [];

  // Generate files for each connector
  for (const connector of connectors) {
    const { meta, schema, dataFlow, connectorUI } = connector;
    const dcrName = connectorIdToDcrName(meta.connectorId, meta.connectorKind);
    const connectorFolder = dataConnectorsFolder.folder(
      `${meta.connectorId}_ccf`,
    )!;

    connectorFolder.file(
      "table.json",
      JSON.stringify(generateTableResource(schema, ""), null, 2),
    );
    connectorFolder.file(
      "DCR.json",
      JSON.stringify(generateDcrResource(schema, dataFlow, dcrName), null, 2),
    );
    connectorFolder.file(
      "connectorDefinition.json",
      JSON.stringify(
        generateConnectorDefinition(meta, schema, connectorUI),
        null,
        2,
      ),
    );
    connectorFolder.file(
      "dataConnector.json",
      JSON.stringify(generateDataConnector(meta, dataFlow, connector.pollerConfig), null, 2),
    );

    connectorPaths.push(
      `Data Connectors/${meta.connectorId}_ccf/connectorDefinition.json`,
    );
  }

  // Generate analytic rules
  if (analyticRules.length > 0) {
    const rulesFolder = root.folder("Analytic Rules")!;
    for (const rule of analyticRules) {
      const safeName = (rule.name || rule.id).replace(/[^a-zA-Z0-9_-]/g, "_");
      rulesFolder.file(`${safeName}.yaml`, generateAnalyticRuleYaml(rule));
      analyticRulePaths.push(`Analytic Rules/${safeName}.yaml`);
    }
  }

  // Generate ASIM parsers
  if (asimParsers.length > 0) {
    const parsersFolder = root.folder("Parsers")!;
    for (const parser of asimParsers) {
      const safeName = (parser.name || parser.id).replace(/[^a-zA-Z0-9_-]/g, "_");
      parsersFolder.file(`${safeName}.yaml`, generateAsimParserYaml(parser));
      parserPaths.push(`Parsers/${safeName}.yaml`);
    }
  }

  // Data folder with solution metadata
  const dataFolder = root.folder("Data")!;
  const firstConnector = connectors[0];
  const solutionDataFile = {
    Name: solutionName,
    Author: `${firstConnector?.meta.publisher || "Publisher"} - ${solution.support.email}`,
    Logo: firstConnector?.meta.logo ?? "",
    Description: firstConnector?.meta.descriptionMarkdown || "",
    "Data Connectors": connectorPaths,
    ...(analyticRulePaths.length > 0 && { "Analytic Rules": analyticRulePaths }),
    ...(parserPaths.length > 0 && { Parsers: parserPaths }),
    BasePath: `C:\\GitHub\\Azure-Sentinel\\Solutions\\${solutionName}`,
    Version: solution.version,
    Metadata: "SolutionMetadata.json",
    TemplateSpec: true,
    Is1PConnector: false,
  };
  dataFolder.file(
    `Solution_${solutionName}.json`,
    JSON.stringify(solutionDataFile, null, 2),
  );

  // SolutionMetadata.json
  const uniquePublishers = [
    ...new Set(connectors.map((c) => c.meta.publisher).filter(Boolean)),
  ];
  const solutionMetadata = {
    publisherId: solution.publisherId,
    offerId: solution.offerId,
    firstPublishDate: solution.firstPublishDate,
    lastPublishDate: solution.firstPublishDate,
    providers: uniquePublishers.length > 0 ? uniquePublishers : [""],
    categories: solution.categories,
    support: solution.support,
  };
  root.file(
    "SolutionMetadata.json",
    JSON.stringify(solutionMetadata, null, 2),
  );

  // ReleaseNotes.md
  root.file(
    "ReleaseNotes.md",
    `# ${solutionName}\n\n## v${solution.version}\n\n- Initial release\n`,
  );

  return zip.generateAsync({ type: "blob" });
}

export async function downloadSolutionZip(appState: AppState) {
  const solutionName =
    appState.solution.name || appState.connectors[0]?.meta.connectorId || "MySolution";
  const blob = await buildSolutionZip(appState);
  saveAs(blob, `${solutionName}.zip`);
}

export interface PackagingJob {
  job_id: string;
  token: string;
  status: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
  created_at: string;
  error?: string;
}

export async function checkPackagerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${PACKAGER_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function submitPackagingJob(blob: Blob): Promise<PackagingJob> {
  const formData = new FormData();
  formData.append("file", blob, "solution.zip");

  const res = await fetch(`${PACKAGER_URL}/jobs`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Packager returned ${res.status}`);
  }

  return res.json();
}

export async function pollJobStatus(jobId: string, token: string): Promise<JobStatusResponse> {
  const res = await fetch(`${PACKAGER_URL}/jobs/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Status check failed: ${res.status}`);
  }

  return res.json();
}

export async function downloadJobResult(jobId: string, token: string): Promise<Blob> {
  const res = await fetch(`${PACKAGER_URL}/jobs/${encodeURIComponent(jobId)}/result`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Download failed: ${res.status}`);
  }

  return res.blob();
}

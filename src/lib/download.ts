import { saveAs } from "file-saver"
import JSZip from "jszip"
import type { ConnectorConfig } from "./schemas";
import { generateTableResource } from "./arm-resources/table";
import { generateDcrResource } from "./arm-resources/dcr";
import { generateConnectorDefinition } from "./arm-resources/connector-def";
import { generateDataConnector } from "./arm-resources/data-connector";
import { connectorIdToDcrName } from "./naming";

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
  const dcrName = connectorIdToDcrName(meta.connectorId);

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
      downloadJson(generateDataConnector(meta, dataFlow), "dataConnector.json");
      break;
  }
}

export async function downloadSolutionZip(config: ConnectorConfig) {
  const { meta, schema, dataFlow, connectorUI, solution } = config;
  const connectorName = meta.connectorId;
  const dcrName = connectorIdToDcrName(meta.connectorId);
  const zip = new JSZip();

  const root = zip.folder(connectorName)!;

  // Data Connectors folder
  const dcFolder = root
    .folder("Data Connectors")!
    .folder(`${connectorName}_ccf`)!;
  dcFolder.file(
    "table.json",
    JSON.stringify(generateTableResource(schema, ""), null, 2),
  );
  dcFolder.file(
    "DCR.json",
    JSON.stringify(generateDcrResource(schema, dataFlow, dcrName), null, 2),
  );
  dcFolder.file(
    "connectorDefinition.json",
    JSON.stringify(
      generateConnectorDefinition(meta, schema, connectorUI),
      null,
      2,
    ),
  );
  dcFolder.file(
    "dataConnector.json",
    JSON.stringify(generateDataConnector(meta, dataFlow), null, 2),
  );

  // Data folder with solution metadata
  const dataFolder = root.folder("Data")!;
  const solutionDataFile = {
    Name: connectorName,
    Author: `${meta.publisher} - ${solution.support.email}`,
    Logo: meta.logo ?? "",
    Description: meta.descriptionMarkdown,
    "Data Connectors": [
      `Data Connectors/${connectorName}_ccf/connectorDefinition.json`,
    ],
    BasePath: `C:\\GitHub\\Azure-Sentinel\\Solutions\\${connectorName}`,
    Version: solution.version,
    Metadata: "SolutionMetadata.json",
    TemplateSpec: true,
    Is1PConnector: false,
  };
  dataFolder.file(
    `Solution_${connectorName}.json`,
    JSON.stringify(solutionDataFile, null, 2),
  );

  // SolutionMetadata.json
  const solutionMetadata = {
    publisherId: solution.publisherId,
    offerId: solution.offerId,
    firstPublishDate: solution.firstPublishDate,
    lastPublishDate: solution.firstPublishDate,
    providers: [meta.publisher],
    categories: solution.categories,
    support: solution.support,
  };
  root.file("SolutionMetadata.json", JSON.stringify(solutionMetadata, null, 2));

  // ReleaseNotes.md
  root.file(
    "ReleaseNotes.md",
    `# ${meta.title}\n\n## v${solution.version}\n\n- Initial release\n`,
  );

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${connectorName}.zip`);
}

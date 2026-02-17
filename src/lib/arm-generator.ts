import type { ConnectorConfig } from "./schemas"
import { connectorIdToDcrName } from "./naming"
import { generateTableResource } from "./arm-resources/table"
import { generateDcrResource } from "./arm-resources/dcr"
import { generateConnectorDefinition } from "./arm-resources/connector-def"
import { generateDataConnector } from "./arm-resources/data-connector"

export function generateArmTemplate(config: ConnectorConfig): Record<string, unknown> {
  const { meta, schema, dataFlow, connectorUI } = config
  const dcrName = connectorIdToDcrName(meta.connectorId)

  const resources = [
    generateTableResource(schema, "[variables('workspaceResourceId')]"),
    generateDcrResource(schema, dataFlow, dcrName),
    generateConnectorDefinition(meta, schema, connectorUI),
    generateDataConnector(meta, dataFlow),
  ]

  return {
    $schema: "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    contentVersion: "1.0.0.0",
    parameters: {
      workspace: {
        type: "string",
        metadata: {
          description: "The Microsoft Sentinel workspace into which the function will be deployed. Has to be in the selected Resource Group."
        }
      },
      "workspace-location": {
        type: "string",
        defaultValue: "[resourceGroup().location]",
        metadata: {
          description: "The location of the Microsoft Sentinel workspace"
        }
      },
    },
    variables: {
      workspaceResourceId: "[parameters('workspace')]",
    },
    resources,
  }
}

import type { Meta, DataFlow } from "../schemas"
import { connectorIdToConnectorDefName, connectorIdToConnectorConfigName, connectorIdToDcrName } from "../naming"

export function generateDataConnector(
  meta: Meta,
  dataFlow: DataFlow,
) {
  const connectorDefName = connectorIdToConnectorDefName(meta.connectorId)
  const connectorConfigName = connectorIdToConnectorConfigName(meta.connectorId)
  const dcrName = connectorIdToDcrName(meta.connectorId)

  return {
    type: "Microsoft.SecurityInsights/dataConnectors",
    apiVersion: "2023-02-01-preview",
    scope: "[parameters('workspace')]",
    name: connectorConfigName,
    location: "[parameters('workspace-location')]",
    dependsOn: [
      `[extensionResourceId(variables('workspaceResourceId'), 'Microsoft.SecurityInsights/dataConnectorDefinitions', '${connectorDefName}')]`,
      `[resourceId('Microsoft.Insights/dataCollectionRules', '${dcrName}')]`,
    ],
    kind: "Customizable",
    properties: {
      connectorUiConfig: {
        id: `[extensionResourceId(variables('workspaceResourceId'), 'Microsoft.SecurityInsights/dataConnectorDefinitions', '${connectorDefName}')]`,
        title: meta.title,
        publisher: meta.publisher,
        descriptionMarkdown: meta.descriptionMarkdown,
        ...(meta.logo ? { logo: meta.logo } : {}),
        dataTypes: [
          {
            name: dataFlow.streamName,
            lastDataReceivedQuery: `${dataFlow.streamName}\n| summarize Time = max(TimeGenerated)\n| where isnotempty(Time)`,
          },
        ],
      },
      dcrConfig: {
        dataCollectionEndpoint: `[[reference(resourceId('Microsoft.Insights/dataCollectionRules', '${dcrName}'), '2021-09-01-preview').dataCollectionEndpointId]]`,
        dataCollectionRuleImmutableId: `[[reference(resourceId('Microsoft.Insights/dataCollectionRules', '${dcrName}'), '2021-09-01-preview').immutableId]]`,
        streamName: dataFlow.streamName,
      },
    },
  }
}

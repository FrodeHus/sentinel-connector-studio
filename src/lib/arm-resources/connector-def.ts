import type { Meta, TableSchema, ConnectorUI } from "../schemas"
import { connectorIdToConnectorDefName } from "../naming"

export function generateConnectorDefinition(
  meta: Meta,
  schema: TableSchema,
  connectorUI: ConnectorUI
) {
  const connectorDefName = connectorIdToConnectorDefName(meta.connectorId)

  return {
    name: connectorDefName,
    apiVersion: "2022-09-01-preview",
    type: "Microsoft.SecurityInsights/dataConnectorDefinitions",
    location: "[parameters('workspace-location')]",
    kind: "Customizable",
    properties: {
      connectorUiConfig: {
        id: connectorDefName,
        title: meta.title,
        publisher: meta.publisher,
        descriptionMarkdown: meta.descriptionMarkdown,
        ...(meta.logo ? { logo: meta.logo } : {}),
        graphQueriesTableName: schema.tableName,
        graphQueries: connectorUI.graphQueries.map((q) => ({
          metricName: q.metricName,
          legend: q.legend,
          baseQuery: q.baseQuery,
        })),
        sampleQueries: connectorUI.sampleQueries.map((q) => ({
          description: q.description,
          query: q.query,
        })),
        connectivityCriteria: connectorUI.connectivityCriteria.map((c) => ({
          type: c.type,
          value: c.value,
        })),
        dataTypes: [
          {
            name: `{{graphQueriesTableName}}`,
            lastDataReceivedQuery: `{{graphQueriesTableName}}\n| summarize Time = max(TimeGenerated)\n| where isnotempty(Time)`,
          },
        ],
        availability: {
          status: 1,
          isPreview: false,
        },
        permissions: {
          resourceProvider: connectorUI.permissions.resourceProvider.map(
            (rp) => ({
              provider: rp.provider,
              permissionsDisplayText: rp.permissionsDisplayText,
              providerDisplayName: rp.providerDisplayName,
              scope: rp.scope,
              requiredPermissions: rp.requiredPermissions,
            }),
          ),
          customs: connectorUI.permissions.customs.map((c) => ({
            name: c.name,
            description: c.description,
          })),
        },
        instructionSteps: connectorUI.instructionSteps.map((step) => ({
          title: step.title,
          description: step.description,
          instructions: step.instructions.map((inst) => ({
            type: inst.type,
            parameters: inst.parameters,
          })),
        })),
      },
    },
  };
}

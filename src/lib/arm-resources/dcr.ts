import type { TableSchema, DataFlow } from "../schemas"
import { tableNameToOutputStreamName } from "../naming"

function buildStreamColumns(schema: TableSchema, dataFlow: DataFlow) {
  const configuredColumns =
    dataFlow.inputColumnsOverride && dataFlow.inputColumns.length > 0
      ? dataFlow.inputColumns
      : schema.columns

  const otherColumns = configuredColumns.filter((col) => col.name !== "TimeGenerated")

  return [
    { name: "TimeGenerated", type: "datetime" as const },
    ...otherColumns,
  ]
}

export function generateDcrResource(
  schema: TableSchema,
  dataFlow: DataFlow,
  dcrName: string
) {
  const inputColumns = buildStreamColumns(schema, dataFlow)

  const outputStreamName = tableNameToOutputStreamName(schema.tableName)

  return {
    name: dcrName,
    apiVersion: "2021-09-01-preview",
    type: "Microsoft.Insights/dataCollectionRules",
    location: "[parameters('workspace-location')]",
    dependsOn: [
      `[resourceId('Microsoft.OperationalInsights/workspaces/tables', parameters('workspace'), '${schema.tableName}')]`,
    ],
    properties: {
      dataCollectionEndpointId: `[concat(subscription().id, '/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Insights/dataCollectionEndpoints/', parameters('workspace'), '-dce')]`,
      streamDeclarations: {
        [dataFlow.streamName]: {
          columns: inputColumns.map((col) => ({
            name: col.name,
            type: col.type,
          })),
        },
      },
      destinations: {
        logAnalytics: [
          {
            workspaceResourceId: "[variables('workspaceResourceId')]",
            name: "clv2ws1",
          },
        ],
      },
      dataFlows: [
        {
          streams: [dataFlow.streamName],
          destinations: ["clv2ws1"],
          transformKql: dataFlow.transformKql,
          outputStream: outputStreamName,
        },
      ],
    },
  };
}

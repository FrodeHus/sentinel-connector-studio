import type { TableSchema, DataFlow } from "../schemas"
import { tableNameToOutputStreamName } from "../naming"

export function generateDcrResource(
  schema: TableSchema,
  dataFlow: DataFlow,
  dcrName: string
) {
  const inputColumns = dataFlow.inputColumnsOverride && dataFlow.inputColumns.length > 0
    ? dataFlow.inputColumns
    : schema.columns.filter(c => c.name !== "TimeGenerated")

  const outputStreamName = tableNameToOutputStreamName(schema.tableName)

  return {
    type: "Microsoft.Insights/dataCollectionRules",
    apiVersion: "2023-03-11",
    name: dcrName,
    location: "[parameters('workspace-location')]",
    dependsOn: [
      `[concat(variables('workspaceResourceId'), '/tables/', '${schema.tableName}')]`,
    ],
    properties: {
      dataCollectionEndpointId: `[concat(subscription().id, '/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Insights/dataCollectionEndpoints/', split(parameters('workspace'), '/')[8], '-dce')]`,
      streamDeclarations: {
        [dataFlow.streamName]: {
          columns: inputColumns.map(col => ({
            name: col.name,
            type: col.type,
          })),
        },
      },
      dataSources: {},
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
  }
}

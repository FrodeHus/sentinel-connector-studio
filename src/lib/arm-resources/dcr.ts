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
    name: dcrName,
    apiVersion: "2021-09-01-preview",
    type: "Microsoft.Insights/dataCollectionRules",
    location: "[parameters('workspace-location')]",
    properties: {
      dataCollectionEndpointId: `[concat(subscription().id, '/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Insights/dataCollectionEndpoints/', split(parameters('workspace'), '/')[8], '-dce')]`,
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

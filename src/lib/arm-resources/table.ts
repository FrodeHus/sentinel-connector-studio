import type { TableSchema } from "../schemas"

function buildTableColumns(schema: TableSchema) {
  const otherColumns = schema.columns.filter((col) => col.name !== "TimeGenerated")

  return [
    { name: "TimeGenerated", type: "datetime" as const },
    ...otherColumns,
  ]
}

export function generateTableResource(schema: TableSchema, _workspaceResourceId: string) {
  return {
    type: "Microsoft.OperationalInsights/workspaces/tables",
    apiVersion: "2025-07-01",
    name: schema.tableName,
    properties: {
      schema: {
        name: schema.tableName,
        columns: buildTableColumns(schema).map((col) => ({
          name: col.name,
          type: col.type,
        })),
      },
    },
  };
}

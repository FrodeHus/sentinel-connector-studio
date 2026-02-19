import { generateTableResource } from "@/lib/arm-resources/table"
import { testSchema } from "./fixtures"

describe("generateTableResource", () => {
  const result = generateTableResource(testSchema, "")

  it("returns correct ARM resource type", () => {
    expect(result.type).toBe("Microsoft.OperationalInsights/workspaces/tables")
  })

  it("returns correct apiVersion", () => {
    expect(result.apiVersion).toBe("2025-07-01")
  })

  it("uses schema tableName as the resource name", () => {
    expect(result.name).toBe("TestConnector_CL")
  })

  it("maps all columns including TimeGenerated", () => {
    expect(result.properties.schema.columns).toEqual([
      { name: "TimeGenerated", type: "datetime" },
      { name: "Message", type: "string" },
      { name: "Severity", type: "int" },
    ])
  })

  it("produces the full expected structure", () => {
    expect(result).toEqual({
      type: "Microsoft.OperationalInsights/workspaces/tables",
      apiVersion: "2025-07-01",
      name: "TestConnector_CL",
      properties: {
        schema: {
          name: "TestConnector_CL",
          columns: [
            { name: "TimeGenerated", type: "datetime" },
            { name: "Message", type: "string" },
            { name: "Severity", type: "int" },
          ],
        },
      },
    })
  })
})

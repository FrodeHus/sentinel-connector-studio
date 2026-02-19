import { generateDcrResource } from "@/lib/arm-resources/dcr"
import { testSchema, testDataFlow, testDataFlowWithOverride } from "./fixtures"

describe("generateDcrResource", () => {
  const dcrName = "TestConnectorPushDCR"
  const result = generateDcrResource(testSchema, testDataFlow, dcrName)

  it("returns correct ARM resource type", () => {
    expect(result.type).toBe("Microsoft.Insights/dataCollectionRules")
  })

  it("returns correct apiVersion", () => {
    expect(result.apiVersion).toBe("2021-09-01-preview")
  })

  it("uses provided dcrName as the resource name", () => {
    expect(result.name).toBe("TestConnectorPushDCR")
  })

  it("uses streamName as the key in streamDeclarations", () => {
    expect(result.properties.streamDeclarations).toHaveProperty("Custom-TestConnector")
  })

  it("excludes TimeGenerated from stream columns by default", () => {
    const columns = result.properties.streamDeclarations["Custom-TestConnector"].columns
    expect(columns).toEqual([
      { name: "Message", type: "string" },
      { name: "Severity", type: "int" },
    ])
  })

  it("uses inputColumns when inputColumnsOverride is true", () => {
    const overrideResult = generateDcrResource(testSchema, testDataFlowWithOverride, dcrName)
    const columns = overrideResult.properties.streamDeclarations["Custom-TestConnector"].columns
    expect(columns).toEqual([
      { name: "msg", type: "string" },
      { name: "sev", type: "int" },
    ])
  })

  it("includes the stream name in dataFlows streams array", () => {
    expect(result.properties.dataFlows[0].streams).toEqual(["Custom-TestConnector"])
  })

  it("passes through transformKql", () => {
    expect(result.properties.dataFlows[0].transformKql).toBe(
      "source | extend TimeGenerated = now()"
    )
  })

  it("generates correct outputStream from table name", () => {
    expect(result.properties.dataFlows[0].outputStream).toBe("Custom-TestConnector_CL")
  })

  it("references workspace via variables expression in logAnalytics destination", () => {
    expect(result.properties.destinations.logAnalytics[0].workspaceResourceId).toBe(
      "[variables('workspaceResourceId')]"
    )
  })
})

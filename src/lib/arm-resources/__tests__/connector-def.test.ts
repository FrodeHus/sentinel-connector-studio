import { generateConnectorDefinition } from "@/lib/arm-resources/connector-def"
import {
  pushMeta,
  pullMeta,
  pushMetaWithLogo,
  testSchema,
  testConnectorUI,
  pullConnectorUI,
} from "./fixtures"

describe("generateConnectorDefinition", () => {
  describe("top-level resource properties", () => {
    const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)

    it("returns correct ARM resource type", () => {
      expect(result.type).toBe("Microsoft.SecurityInsights/dataConnectorDefinitions")
    })

    it("returns correct apiVersion", () => {
      expect(result.apiVersion).toBe("2022-09-01-preview")
    })

    it("kind is always Customizable", () => {
      expect(result.kind).toBe("Customizable")
    })
  })

  describe("connector naming", () => {
    it("Push connector name uses {Id}Push pattern", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.name).toBe("TestConnectorPush")
    })

    it("Pull connector name uses {Id}Poller pattern", () => {
      const result = generateConnectorDefinition(pullMeta, testSchema, pullConnectorUI)
      expect(result.name).toBe("TestConnectorPoller")
    })

    it("connectorUiConfig.id matches the connector definition name", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.properties.connectorUiConfig.id).toBe(result.name)
    })
  })

  describe("metadata passthrough", () => {
    const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
    const config = result.properties.connectorUiConfig

    it("passes through title, publisher, and descriptionMarkdown", () => {
      expect(config.title).toBe("Test Connector")
      expect(config.publisher).toBe("TestPublisher")
      expect(config.descriptionMarkdown).toBe("Test description")
    })

    it("omits logo when empty string", () => {
      expect("logo" in config).toBe(false)
    })

    it("includes logo when provided", () => {
      const withLogo = generateConnectorDefinition(pushMetaWithLogo, testSchema, testConnectorUI)
      expect(withLogo.properties.connectorUiConfig.logo).toBe("<svg>test</svg>")
    })
  })

  describe("graphQueriesTableName", () => {
    it("matches schema tableName", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.properties.connectorUiConfig.graphQueriesTableName).toBe("TestConnector_CL")
    })
  })

  describe("graphQueries", () => {
    it("maps graphQueries correctly", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.properties.connectorUiConfig.graphQueries).toEqual([
        { metricName: "Total events", legend: "Events", baseQuery: "{{graphQueriesTableName}}" },
      ])
    })
  })

  describe("sampleQueries", () => {
    it("maps sampleQueries correctly", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.properties.connectorUiConfig.sampleQueries).toEqual([
        { description: "All events", query: "TestConnector_CL | take 10" },
      ])
    })
  })

  describe("connectivityCriteria", () => {
    it("maps Push IsConnectedQuery criteria", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.properties.connectorUiConfig.connectivityCriteria).toEqual([
        { type: "IsConnectedQuery", value: ["TestConnector_CL | summarize max(TimeGenerated)"] },
      ])
    })

    it("maps Pull HasDataConnectors criteria", () => {
      const result = generateConnectorDefinition(pullMeta, testSchema, pullConnectorUI)
      expect(result.properties.connectorUiConfig.connectivityCriteria).toEqual([
        { type: "HasDataConnectors", value: [] },
      ])
    })
  })

  describe("dataTypes", () => {
    it("uses {{graphQueriesTableName}} placeholder", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      const dataTypes = result.properties.connectorUiConfig.dataTypes
      expect(dataTypes[0].name).toBe("{{graphQueriesTableName}}")
      expect(dataTypes[0].lastDataReceivedQuery).toContain("{{graphQueriesTableName}}")
    })
  })

  describe("availability", () => {
    it("has status 1 and isPreview false", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.properties.connectorUiConfig.availability).toEqual({
        status: 1,
        isPreview: false,
      })
    })
  })

  describe("permissions", () => {
    it("maps resourceProvider and customs", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      const perms = result.properties.connectorUiConfig.permissions
      expect(perms.resourceProvider).toEqual([
        {
          provider: "Microsoft.OperationalInsights/workspaces",
          permissionsDisplayText: "Read and Write",
          providerDisplayName: "Workspace",
          scope: "Workspace",
          requiredPermissions: { write: true, read: true, delete: false, action: false },
        },
      ])
      expect(perms.customs).toEqual([{ name: "API Key", description: "Required" }])
    })
  })

  describe("instructionSteps", () => {
    it("maps instruction steps with nested instructions", () => {
      const result = generateConnectorDefinition(pushMeta, testSchema, testConnectorUI)
      expect(result.properties.connectorUiConfig.instructionSteps).toEqual([
        {
          title: "Connect",
          description: "Follow steps",
          instructions: [{ type: "Markdown", parameters: { content: "Hello" } }],
        },
      ])
    })
  })
})

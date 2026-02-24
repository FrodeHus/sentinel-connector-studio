import { describe, it, expect } from "vitest"
import {
  generateDefaultGraphQueries,
  generateDefaultSampleQueries,
  generateDefaultConnectivityCriteria,
  generateDefaultPermissions,
  generateDefaultInstructionSteps,
  generateDefaultConnectorUI,
} from "@/lib/defaults"

describe("generateDefaultGraphQueries", () => {
  it("returns an array with one graph query", () => {
    const result = generateDefaultGraphQueries("TestTable_CL")
    expect(result).toHaveLength(1)
  })

  it("uses the graphQueriesTableName template variable in baseQuery", () => {
    const result = generateDefaultGraphQueries("TestTable_CL")
    expect(result[0].baseQuery).toBe("{{graphQueriesTableName}}")
  })
})

describe("generateDefaultSampleQueries", () => {
  it("returns 2 queries when columns include a string column", () => {
    const columns = [
      { name: "TimeGenerated", type: "datetime" as const },
      { name: "Message", type: "string" as const },
    ]
    const result = generateDefaultSampleQueries("TestTable_CL", columns)
    expect(result).toHaveLength(2)
  })

  it("returns 1 query when no string column is present", () => {
    const columns = [
      { name: "TimeGenerated", type: "datetime" as const },
      { name: "Count", type: "int" as const },
    ]
    const result = generateDefaultSampleQueries("TestTable_CL", columns)
    expect(result).toHaveLength(1)
  })
})

describe("generateDefaultConnectivityCriteria", () => {
  it("returns IsConnectedQuery for Push kind", () => {
    const result = generateDefaultConnectivityCriteria("TestTable_CL", "Push")
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("IsConnectedQuery")
    expect(result[0].value[0]).toContain("TestTable_CL")
  })

  it("returns HasDataConnectors for RestApiPoller kind", () => {
    const result = generateDefaultConnectivityCriteria("TestTable_CL", "RestApiPoller")
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("HasDataConnectors")
    expect(result[0].value).toEqual([])
  })
})

describe("generateDefaultPermissions", () => {
  it("returns 2 resourceProvider entries", () => {
    const result = generateDefaultPermissions()
    expect(result.resourceProvider).toHaveLength(2)
  })

  it("returns 2 customs entries", () => {
    const result = generateDefaultPermissions()
    expect(result.customs).toHaveLength(2)
  })
})

describe("generateDefaultInstructionSteps", () => {
  describe("Push kind", () => {
    it("returns 2 instruction steps", () => {
      const result = generateDefaultInstructionSteps(
        "TestConnector",
        "TestConnector_CL",
        "Custom-TestConnector",
        "Push",
      )
      expect(result).toHaveLength(2)
    })

    it("first step has a DeployPushConnectorButton instruction", () => {
      const result = generateDefaultInstructionSteps(
        "TestConnector",
        "TestConnector_CL",
        "Custom-TestConnector",
        "Push",
      )
      expect(result[0].instructions[0].type).toBe("DeployPushConnectorButton")
    })

    it("second step has 6 CopyableLabel instructions", () => {
      const result = generateDefaultInstructionSteps(
        "TestConnector",
        "TestConnector_CL",
        "Custom-TestConnector",
        "Push",
      )
      expect(result[1].instructions).toHaveLength(6)
      for (const instruction of result[1].instructions) {
        expect(instruction.type).toBe("CopyableLabel")
      }
    })
  })

  describe("RestApiPoller kind", () => {
    it("returns 1 instruction step", () => {
      const result = generateDefaultInstructionSteps(
        "TestConnector",
        "TestConnector_CL",
        "Custom-TestConnector",
        "RestApiPoller",
      )
      expect(result).toHaveLength(1)
    })

    it("step has Textbox instructions followed by ConnectionToggleButton (Basic auth default)", () => {
      const result = generateDefaultInstructionSteps(
        "TestConnector",
        "TestConnector_CL",
        "Custom-TestConnector",
        "RestApiPoller",
        "Basic",
      )
      expect(result[0].instructions).toHaveLength(3)
      expect(result[0].instructions[0].type).toBe("Textbox")
      expect(result[0].instructions[1].type).toBe("Textbox")
      expect(result[0].instructions[2].type).toBe("ConnectionToggleButton")
    })

    it("step has OAuthForm instruction for OAuth2 auth", () => {
      const result = generateDefaultInstructionSteps(
        "TestConnector",
        "TestConnector_CL",
        "Custom-TestConnector",
        "RestApiPoller",
        "OAuth2",
      )
      expect(result[0].instructions).toHaveLength(1)
      expect(result[0].instructions[0].type).toBe("OAuthForm")
    })

    it("step has Textbox + ConnectionToggleButton for APIKey auth", () => {
      const result = generateDefaultInstructionSteps(
        "TestConnector",
        "TestConnector_CL",
        "Custom-TestConnector",
        "RestApiPoller",
        "APIKey",
      )
      expect(result[0].instructions).toHaveLength(2)
      expect(result[0].instructions[0].type).toBe("Textbox")
      expect(result[0].instructions[1].type).toBe("ConnectionToggleButton")
    })
  })
})

describe("generateDefaultConnectorUI", () => {
  it("combines all default generators into a ConnectorUI object", () => {
    const columns = [
      { name: "TimeGenerated", type: "datetime" as const },
      { name: "Message", type: "string" as const },
    ]
    const result = generateDefaultConnectorUI(
      "TestConnector",
      "TestConnector_CL",
      "Custom-TestConnector",
      columns,
      "Push",
    )

    expect(result.graphQueries).toBeDefined()
    expect(result.sampleQueries).toBeDefined()
    expect(result.connectivityCriteria).toBeDefined()
    expect(result.permissions).toBeDefined()
    expect(result.instructionSteps).toBeDefined()
  })

  it("passes connector kind through to connectivity criteria for Push", () => {
    const columns = [{ name: "TimeGenerated", type: "datetime" as const }]
    const result = generateDefaultConnectorUI(
      "TestConnector",
      "TestConnector_CL",
      "Custom-TestConnector",
      columns,
      "Push",
    )
    expect(result.connectivityCriteria[0].type).toBe("IsConnectedQuery")
  })

  it("passes connector kind through to connectivity criteria for RestApiPoller", () => {
    const columns = [{ name: "TimeGenerated", type: "datetime" as const }]
    const result = generateDefaultConnectorUI(
      "TestConnector",
      "TestConnector_CL",
      "Custom-TestConnector",
      columns,
      "RestApiPoller",
    )
    expect(result.connectivityCriteria[0].type).toBe("HasDataConnectors")
  })
})

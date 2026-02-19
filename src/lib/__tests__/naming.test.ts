import { describe, it, expect } from "vitest"
import {
  titleToConnectorId,
  connectorIdToTableName,
  tableNameToStreamName,
  tableNameToOutputStreamName,
  connectorIdToDcrName,
  connectorIdToConnectorDefName,
  connectorIdToConnectorConfigName,
} from "@/lib/naming"

describe("titleToConnectorId", () => {
  it("converts a multi-word title to PascalCase connector ID", () => {
    expect(titleToConnectorId("Contoso Security Alerts")).toBe("ContosoSecurityAlerts")
  })

  it("strips non-alphanumeric characters", () => {
    expect(titleToConnectorId("my-app!")).toBe("Myapp")
  })

  it("returns empty string for empty input", () => {
    expect(titleToConnectorId("")).toBe("")
  })
})

describe("connectorIdToTableName", () => {
  it("appends _CL suffix", () => {
    expect(connectorIdToTableName("MyConn")).toBe("MyConn_CL")
  })
})

describe("tableNameToStreamName", () => {
  it("strips _CL and prepends Custom-", () => {
    expect(tableNameToStreamName("MyConn_CL")).toBe("Custom-MyConn")
  })

  it("prepends Custom- to a name without _CL suffix", () => {
    expect(tableNameToStreamName("Simple")).toBe("Custom-Simple")
  })
})

describe("tableNameToOutputStreamName", () => {
  it("prepends Custom- and keeps full table name", () => {
    expect(tableNameToOutputStreamName("MyConn_CL")).toBe("Custom-MyConn_CL")
  })
})

describe("connectorIdToDcrName", () => {
  it("defaults to Push suffix", () => {
    expect(connectorIdToDcrName("MyConn")).toBe("MyConnPushDCR")
  })

  it("uses Push suffix for Push kind", () => {
    expect(connectorIdToDcrName("MyConn", "Push")).toBe("MyConnPushDCR")
  })

  it("uses Poller suffix for RestApiPoller kind", () => {
    expect(connectorIdToDcrName("MyConn", "RestApiPoller")).toBe("MyConnPollerDCR")
  })
})

describe("connectorIdToConnectorDefName", () => {
  it("defaults to Push suffix", () => {
    expect(connectorIdToConnectorDefName("MyConn")).toBe("MyConnPush")
  })

  it("uses Poller suffix for RestApiPoller kind", () => {
    expect(connectorIdToConnectorDefName("MyConn", "RestApiPoller")).toBe("MyConnPoller")
  })
})

describe("connectorIdToConnectorConfigName", () => {
  it("defaults to Push suffix with Connector postfix", () => {
    expect(connectorIdToConnectorConfigName("MyConn")).toBe("MyConnPushConnector")
  })

  it("uses Poller suffix for RestApiPoller kind", () => {
    expect(connectorIdToConnectorConfigName("MyConn", "RestApiPoller")).toBe(
      "MyConnPollerConnector",
    )
  })
})

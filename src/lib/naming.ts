import type { ConnectorKind } from "./schemas"

export function titleToConnectorId(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}

export function connectorIdToTableName(connectorId: string): string {
  return `${connectorId}_CL`
}

export function tableNameToStreamName(tableName: string): string {
  const base = tableName.replace(/_CL$/, "")
  return `Custom-${base}`
}

export function tableNameToOutputStreamName(tableName: string): string {
  return `Custom-${tableName}`
}

function kindSuffix(kind: ConnectorKind = "Push"): string {
  return kind === "RestApiPoller" ? "Poller" : "Push"
}

export function connectorIdToDcrName(connectorId: string, kind?: ConnectorKind): string {
  return `${connectorId}${kindSuffix(kind)}DCR`
}

export function connectorIdToConnectorDefName(connectorId: string, kind?: ConnectorKind): string {
  return `${connectorId}${kindSuffix(kind)}`
}

export function connectorIdToConnectorConfigName(connectorId: string, kind?: ConnectorKind): string {
  return `${connectorId}${kindSuffix(kind)}Connector`
}

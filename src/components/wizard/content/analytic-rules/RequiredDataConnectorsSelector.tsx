import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { RequiredDataConnector } from "@/lib/schemas"
import type { AvailableConnector } from "./types"

interface RequiredDataConnectorsSelectorProps {
  availableConnectors: AvailableConnector[]
  selectedConnectors: RequiredDataConnector[]
  onChange: (connectors: RequiredDataConnector[]) => void
}

export function RequiredDataConnectorsSelector({
  availableConnectors,
  selectedConnectors,
  onChange,
}: RequiredDataConnectorsSelectorProps) {
  const toggleConnector = (connectorId: string) => {
    const existing = selectedConnectors.find((r) => r.connectorId === connectorId)
    if (existing) {
      onChange(selectedConnectors.filter((r) => r.connectorId !== connectorId))
      return
    }

    const connector = availableConnectors.find((c) => c.connectorId === connectorId)
    if (!connector) return

    onChange([
      ...selectedConnectors,
      { connectorId: connector.connectorId, dataTypes: connector.dataTypes },
    ])
  }

  if (availableConnectors.length === 0) return null

  return (
    <div>
      <Label>Required Data Connectors</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {availableConnectors.map((c) => (
          <button
            key={c.connectorId}
            type="button"
            onClick={() => toggleConnector(c.connectorId)}
            title={c.dataTypes.length > 0 ? c.dataTypes.join(", ") : undefined}
          >
            <Badge variant={selectedConnectors.some((r) => r.connectorId === c.connectorId) ? "default" : "outline"}>
              {c.label}
            </Badge>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Click badges to select which data connectors this item depends on.
      </p>
    </div>
  )
}

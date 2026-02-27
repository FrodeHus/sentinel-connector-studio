import { Label } from "@/components/ui/label"
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
          <label key={c.connectorId} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={selectedConnectors.some((r) => r.connectorId === c.connectorId)}
              onChange={() => toggleConnector(c.connectorId)}
              className="rounded"
            />
            <span>{c.label}</span>
            {c.dataTypes.length > 0 && (
              <span className="text-muted-foreground">
                ({c.dataTypes.join(", ")})
              </span>
            )}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Select which data connectors this item depends on.
      </p>
    </div>
  )
}

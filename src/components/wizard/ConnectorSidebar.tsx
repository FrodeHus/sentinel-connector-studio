import type { ConnectorData } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface ConnectorSidebarProps {
  connectors: ConnectorData[]
  activeIndex: number
  onSelect: (index: number) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function ConnectorSidebar({
  connectors,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
}: ConnectorSidebarProps) {
  return (
    <div className="w-56 shrink-0 border-r border-border/50 bg-card/30 flex flex-col">
      <div className="px-3 py-3 border-b border-border/50">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Connectors
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1">
        {connectors.map((connector, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`
              w-full px-3 py-2 rounded-md text-left text-sm
              transition-colors relative group cursor-pointer
              ${
                index === activeIndex
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }
            `}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="truncate font-medium">
                {connector.meta.title || `Connector ${index + 1}`}
              </span>
              {connectors.length > 1 && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm("Remove this connector?")) {
                      onRemove(index)
                    }
                  }}
                  className={`
                    opacity-0 group-hover:opacity-100
                    p-1 rounded-sm transition-opacity shrink-0
                    ${
                      index === activeIndex
                        ? "hover:bg-primary-foreground/20"
                        : "hover:bg-destructive/20 text-destructive"
                    }
                  `}
                  title="Remove connector"
                >
                  <Trash2 className="w-3 h-3" />
                </span>
              )}
            </div>
            {connector.meta.connectorId && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs truncate ${
                    index === activeIndex
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {connector.meta.connectorId}
                </span>
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-medium shrink-0 ${
                    connector.meta.connectorKind === "RestApiPoller"
                      ? index === activeIndex
                        ? "bg-orange-400/30 text-orange-100"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                      : index === activeIndex
                        ? "bg-sky-400/30 text-sky-100"
                        : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                  }`}
                >
                  {connector.meta.connectorKind === "RestApiPoller" ? "Pull" : "Push"}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="p-2 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Connector
        </Button>
      </div>
    </div>
  )
}

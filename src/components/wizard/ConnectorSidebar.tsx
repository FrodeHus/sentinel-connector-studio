import * as React from "react"
import type { ConnectorData } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [confirmRemoveIndex, setConfirmRemoveIndex] = React.useState<number | null>(null)

  return (
    <div className="w-60 shrink-0 bg-transparent flex flex-col px-3 py-4">
      <div className="px-1 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Connectors
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-2.5 space-y-2">
        {connectors.map((connector, index) => (
          <div key={index} className="relative group flex items-stretch">
            <button
              onClick={() => onSelect(index)}
              className={`
                flex-1 min-w-0 px-3 py-2.5 rounded-xl text-left text-sm border shadow-sm
                transition-colors cursor-pointer
                ${
                  index === activeIndex
                    ? "bg-primary text-primary-foreground border-primary/60"
                    : "bg-card/80 text-foreground border-border/50 hover:bg-muted/60"
                }
              `}
            >
              <span className="truncate font-medium block">
                {connector.meta.title || `Connector ${index + 1}`}
              </span>
              {connector.meta.connectorId && (
                <div className="flex items-center gap-1.5 mt-0.5">
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
            {connectors.length > 1 && (
              <button
                onClick={() => setConfirmRemoveIndex(index)}
                title="Remove connector"
                className={`
                  opacity-0 group-hover:opacity-100
                  p-1 rounded-md transition-opacity shrink-0 self-center
                  ${
                    index === activeIndex
                      ? "hover:bg-primary-foreground/20 text-primary-foreground"
                      : "hover:bg-destructive/20 text-destructive"
                  }
                `}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="w-full bg-card/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Connector
        </Button>
      </div>

      <Dialog
        open={confirmRemoveIndex !== null}
        onOpenChange={(open) => { if (!open) setConfirmRemoveIndex(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove connector</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              {confirmRemoveIndex !== null
                ? connectors[confirmRemoveIndex]?.meta.title || `Connector ${confirmRemoveIndex + 1}`
                : "this connector"}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemoveIndex(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmRemoveIndex !== null) {
                  onRemove(confirmRemoveIndex)
                  setConfirmRemoveIndex(null)
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { EntityFieldMapping } from "@/lib/schemas"

interface FieldMappingRowProps {
  fm: EntityFieldMapping
  identifierOptions: string[]
  projectCols: string[]
  onUpdate: (updates: Partial<EntityFieldMapping>) => void
  onRemove: () => void
}

export function FieldMappingRow({ fm, identifierOptions, projectCols, onUpdate, onRemove }: FieldMappingRowProps) {
  const isIdentifierCustom =
    identifierOptions.length > 0 &&
    !identifierOptions.includes(fm.identifier) &&
    fm.identifier !== ""

  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="flex-1 min-w-0">
        {identifierOptions.length > 0 ? (
          <select
            className="flex h-8 w-full rounded-xl border border-border/50 bg-card px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={isIdentifierCustom ? "__custom__" : fm.identifier}
            onChange={(e) => {
              const val = e.target.value
              onUpdate({ identifier: val === "__custom__" ? "" : val })
            }}
          >
            <option value="" disabled>Select identifier...</option>
            {identifierOptions.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
            <option value="__custom__">Custom...</option>
          </select>
        ) : (
          <Input
            className="h-8 text-xs"
            value={fm.identifier}
            onChange={(e) => onUpdate({ identifier: e.target.value })}
            placeholder="Identifier"
          />
        )}
      </div>
      {isIdentifierCustom && (
        <div className="flex-1 min-w-0">
          <Input
            className="h-8 text-xs"
            value={fm.identifier}
            onChange={(e) => onUpdate({ identifier: e.target.value })}
            placeholder="Custom identifier"
          />
        </div>
      )}
      {projectCols.length > 0 && (
        <div className="flex-1 min-w-0">
          <select
            className="flex h-8 w-full rounded-xl border border-border/50 bg-card px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={projectCols.includes(fm.columnName) ? fm.columnName : ""}
            onChange={(e) => {
              if (e.target.value) {
                onUpdate({ columnName: e.target.value })
              }
            }}
          >
            <option value="">Pick from query...</option>
            {projectCols.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Input
          className="h-8 text-xs"
          value={fm.columnName}
          onChange={(e) => onUpdate({ columnName: e.target.value })}
          placeholder="Column Name"
        />
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  )
}

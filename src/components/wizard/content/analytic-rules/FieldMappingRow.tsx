import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
          <Select
            value={isIdentifierCustom ? "__custom__" : (fm.identifier || undefined)}
            onValueChange={(val) => {
              onUpdate({ identifier: val === "__custom__" ? "" : val })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select identifier..." />
            </SelectTrigger>
            <SelectContent>
              {identifierOptions.map((id) => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
              <SelectItem value="__custom__">Custom...</SelectItem>
            </SelectContent>
          </Select>
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
          <Select
            value={projectCols.includes(fm.columnName) ? fm.columnName : undefined}
            onValueChange={(val) => onUpdate({ columnName: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Pick from query..." />
            </SelectTrigger>
            <SelectContent>
              {projectCols.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

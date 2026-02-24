import * as React from "react"
import type { Column } from "@/lib/schemas"
import { columnTypes } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react"

interface SchemaEditorProps {
  columns: Column[]
  onChange: (columns: Column[]) => void
}

export function SchemaEditor({ columns, onChange }: SchemaEditorProps) {
  const addColumn = () => {
    onChange([...columns, { name: "", type: "string" }])
  }

  const removeColumn = (index: number) => {
    if (columns[index].name === "TimeGenerated") return
    onChange(columns.filter((_, i) => i !== index))
  }

  const updateColumn = (index: number, field: keyof Column, value: string) => {
    const updated = columns.map((col, i) =>
      i === index ? { ...col, [field]: value } : col
    )
    onChange(updated)
  }

  const moveColumn = (index: number, direction: "up" | "down") => {
    if (columns[index].name === "TimeGenerated") return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= columns.length) return
    if (columns[targetIndex].name === "TimeGenerated") return

    const updated = [...columns]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    onChange(updated)
  }

  const duplicateNames = React.useMemo(() => {
    const names = columns.map(c => c.name.toLowerCase()).filter(Boolean)
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const n of names) {
      if (seen.has(n)) dupes.add(n)
      seen.add(n)
    }
    return dupes
  }, [columns])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_140px_80px] gap-2 items-center text-xs font-medium text-muted-foreground px-1">
        <span>Column Name</span>
        <span>Type</span>
        <span>Actions</span>
      </div>

      {columns.map((col, index) => {
        const isLocked = col.name === "TimeGenerated"
        const isDuplicate = col.name && duplicateNames.has(col.name.toLowerCase())
        const isInvalidName = col.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col.name)

        return (
          <div
            key={index}
            className="grid grid-cols-[1fr_140px_80px] gap-2 items-center"
          >
            <div>
              <Input
                value={col.name}
                onChange={e => updateColumn(index, "name", e.target.value)}
                placeholder="ColumnName"
                disabled={isLocked}
                className={
                  isDuplicate || (isInvalidName && !isLocked)
                    ? "border-destructive"
                    : ""
                }
              />
              {isDuplicate && (
                <p className="text-xs text-destructive mt-1">Duplicate name</p>
              )}
              {isInvalidName && !isLocked && (
                <p className="text-xs text-destructive mt-1">Invalid name</p>
              )}
            </div>

            <Select
              value={col.type}
              onValueChange={v => updateColumn(index, "type", v)}
              disabled={isLocked}
            >
              <SelectTrigger aria-label={`Column type for ${col.name || "new column"}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              {!isLocked && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveColumn(index, "up")}
                    disabled={index <= 1}
                    aria-label={`Move ${col.name || "column"} up`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveColumn(index, "down")}
                    disabled={index >= columns.length - 1}
                    aria-label={`Move ${col.name || "column"} down`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeColumn(index)}
                    aria-label={`Remove ${col.name || "column"} column`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {isLocked && (
                <span className="text-xs text-muted-foreground px-2">locked</span>
              )}
            </div>
          </div>
        )
      })}

      <Button variant="outline" size="sm" onClick={addColumn} className="mt-2">
        <Plus className="w-4 h-4 mr-1" /> Add Column
      </Button>
    </div>
  )
}

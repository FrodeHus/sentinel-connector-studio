import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { EntityMapping, EntityFieldMapping } from "@/lib/schemas"
import { ENTITY_TYPES, ENTITY_IDENTIFIERS } from "./constants"
import { FieldMappingRow } from "./FieldMappingRow"

interface EntityMappingRowProps {
  mapping: EntityMapping
  projectCols: string[]
  onChange: (updates: Partial<EntityMapping>) => void
  onRemove: () => void
}

export function EntityMappingRow({ mapping, projectCols, onChange, onRemove }: EntityMappingRowProps) {
  const identifierOptions = ENTITY_IDENTIFIERS[mapping.entityType] ?? []

  const addFieldMapping = () => {
    const fm: EntityFieldMapping = { id: crypto.randomUUID(), identifier: "", columnName: "" }
    onChange({ fieldMappings: [...mapping.fieldMappings, fm] })
  }

  const updateFieldMapping = (fieldId: string, updates: Partial<EntityFieldMapping>) => {
    onChange({
      fieldMappings: mapping.fieldMappings.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f,
      ),
    })
  }

  const removeFieldMapping = (fieldId: string) => {
    onChange({ fieldMappings: mapping.fieldMappings.filter((f) => f.id !== fieldId) })
  }

  return (
    <div className="border border-border/50 rounded-lg p-3 mb-2 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label className="text-xs">Entity Type</Label>
          <Select
            value={mapping.entityType || undefined}
            onValueChange={(val) => onChange({ entityType: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select entity type..." />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((et) => (
                <SelectItem key={et} value={et}>{et}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="mt-5"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
      <div className="pl-2">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Field Mappings</Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={addFieldMapping}
          >
            <Plus className="w-3 h-3 mr-1" /> Field
          </Button>
        </div>
        {mapping.fieldMappings.map((fm) => (
          <FieldMappingRow
            key={fm.id}
            fm={fm}
            identifierOptions={identifierOptions}
            projectCols={projectCols}
            onUpdate={(updates) => updateFieldMapping(fm.id, updates)}
            onRemove={() => removeFieldMapping(fm.id)}
          />
        ))}
      </div>
    </div>
  )
}

import { KqlEditor } from "@/components/kql-editor/KqlEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { AnalyticRule, EntityMapping } from "@/lib/schemas"
import { MITRE_TACTICS } from "./constants"
import { EntityMappingRow } from "./EntityMappingRow"
import { RequiredDataConnectorsSelector } from "./RequiredDataConnectorsSelector"
import type { AvailableConnector } from "./types"

/**
 * Extract column names from the last `| project` statement in a KQL query.
 * Handles aliases (e.g. `Alias = expr`) and plain column references.
 */
function extractProjectColumns(query: string): string[] {
  const projectRegex = /\|\s*project\s+(?!away\b|rename\b|keep\b|reorder\b)([\s\S]*?)(?=\||$)/gi
  let lastMatch: RegExpExecArray | null = null
  let m: RegExpExecArray | null
  while ((m = projectRegex.exec(query)) !== null) {
    lastMatch = m
  }
  if (!lastMatch) return []
  const body = lastMatch[1]
  return body
    .split(",")
    .map((part) => {
      const trimmed = part.trim()
      const assignMatch = trimmed.match(/^([A-Za-z_]\w*)\s*=/)
      if (assignMatch) return assignMatch[1]
      const identMatch = trimmed.match(/^([A-Za-z_]\w*)/)
      return identMatch ? identMatch[1] : ""
    })
    .filter(Boolean)
}

interface RuleItemProps {
  rule: AnalyticRule
  availableConnectors: AvailableConnector[]
  onChange: (updates: Partial<AnalyticRule>) => void
  onRemove: () => void
}

export function RuleItem({ rule, availableConnectors, onChange, onRemove }: RuleItemProps) {
  const projectCols = extractProjectColumns(rule.query)

  const toggleTactic = (tactic: string) => {
    const tactics = rule.tactics.includes(tactic)
      ? rule.tactics.filter((t) => t !== tactic)
      : [...rule.tactics, tactic]
    onChange({ tactics })
  }

  const addEntityMapping = () => {
    const mapping: EntityMapping = {
      id: crypto.randomUUID(),
      entityType: "",
      fieldMappings: [{ id: crypto.randomUUID(), identifier: "", columnName: "" }],
    }
    onChange({ entityMappings: [...rule.entityMappings, mapping] })
  }

  const updateEntityMapping = (mappingId: string, updates: Partial<EntityMapping>) => {
    onChange({
      entityMappings: rule.entityMappings.map((m) =>
        m.id === mappingId ? { ...m, ...updates } : m,
      ),
    })
  }

  const removeEntityMapping = (mappingId: string) => {
    onChange({ entityMappings: rule.entityMappings.filter((m) => m.id !== mappingId) })
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>Name</Label>
          <Input
            value={rule.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Detection rule name"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={rule.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Describe what this rule detects..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Severity</Label>
          <Select
            value={rule.severity}
            onValueChange={(val) => onChange({ severity: val as AnalyticRule["severity"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Informational">Informational</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Kind</Label>
          <Select
            value={rule.kind}
            onValueChange={(val) => onChange({ kind: val as AnalyticRule["kind"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="NRT">NRT (Near Real-Time)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rule.kind === "Scheduled" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Query Period (ISO 8601)</Label>
            <Input
              value={rule.queryPeriod}
              onChange={(e) => onChange({ queryPeriod: e.target.value })}
              placeholder="PT5H"
            />
          </div>
          <div>
            <Label>Query Frequency (ISO 8601)</Label>
            <Input
              value={rule.queryFrequency}
              onChange={(e) => onChange({ queryFrequency: e.target.value })}
              placeholder="PT5H"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Trigger Operator</Label>
          <Select
            value={rule.triggerOperator}
            onValueChange={(val) => onChange({ triggerOperator: val as AnalyticRule["triggerOperator"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GreaterThan">Greater Than</SelectItem>
              <SelectItem value="LessThan">Less Than</SelectItem>
              <SelectItem value="Equal">Equal</SelectItem>
              <SelectItem value="NotEqual">Not Equal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Trigger Threshold</Label>
          <Input
            type="number"
            value={rule.triggerThreshold}
            onChange={(e) => onChange({ triggerThreshold: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label>Query (KQL)</Label>
        <KqlEditor
          value={rule.query}
          onChange={(value) => onChange({ query: value })}
          mode="full"
          showSnippets={false}
          height="200px"
        />
      </div>

      <div>
        <Label>MITRE ATT&amp;CK Tactics</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {MITRE_TACTICS.map((tactic) => (
            <label key={tactic} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={rule.tactics.includes(tactic)}
                onChange={() => toggleTactic(tactic)}
                className="rounded"
              />
              {tactic.replace(/([A-Z])/g, " $1").trim()}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Relevant Techniques (comma-separated)</Label>
        <Input
          value={rule.relevantTechniques.join(", ")}
          onChange={(e) =>
            onChange({
              relevantTechniques: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          placeholder="T1078, T1098, T1110"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Entity Mappings</Label>
          <Button size="sm" variant="outline" onClick={addEntityMapping}>
            <Plus className="w-3 h-3 mr-1" /> Add Mapping
          </Button>
        </div>
        {rule.entityMappings.map((mapping) => (
          <EntityMappingRow
            key={mapping.id}
            mapping={mapping}
            projectCols={projectCols}
            onChange={(updates) => updateEntityMapping(mapping.id, updates)}
            onRemove={() => removeEntityMapping(mapping.id)}
          />
        ))}
      </div>

      <RequiredDataConnectorsSelector
        availableConnectors={availableConnectors}
        selectedConnectors={rule.requiredDataConnectors}
        onChange={(requiredDataConnectors) => onChange({ requiredDataConnectors })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Version</Label>
          <Input
            value={rule.version}
            onChange={(e) => onChange({ version: e.target.value })}
            placeholder="1.0.0"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="destructive" size="sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4 mr-1" /> Delete Rule
        </Button>
      </div>
    </div>
  )
}

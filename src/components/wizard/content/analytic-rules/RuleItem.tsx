import * as React from "react"
import { KqlEditor } from "@/components/kql-editor/KqlEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import type { AnalyticRule, EntityMapping } from "@/lib/schemas"
import { MITRE_TACTICS } from "./constants"
import { EntityMappingRow } from "./EntityMappingRow"

export interface AvailableConnector {
  connectorId: string
  dataTypes: string[]
  label: string
}

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

  const toggleConnector = (connectorId: string) => {
    const existing = rule.requiredDataConnectors.find((r) => r.connectorId === connectorId)
    if (existing) {
      onChange({
        requiredDataConnectors: rule.requiredDataConnectors.filter(
          (r) => r.connectorId !== connectorId,
        ),
      })
    } else {
      const connector = availableConnectors.find((c) => c.connectorId === connectorId)
      if (connector) {
        onChange({
          requiredDataConnectors: [
            ...rule.requiredDataConnectors,
            { connectorId: connector.connectorId, dataTypes: connector.dataTypes },
          ],
        })
      }
    }
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
          <select
            className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={rule.severity}
            onChange={(e) => onChange({ severity: e.target.value as AnalyticRule["severity"] })}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>
        </div>
        <div>
          <Label>Kind</Label>
          <select
            className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={rule.kind}
            onChange={(e) => onChange({ kind: e.target.value as AnalyticRule["kind"] })}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="NRT">NRT (Near Real-Time)</option>
          </select>
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
          <select
            className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={rule.triggerOperator}
            onChange={(e) => onChange({ triggerOperator: e.target.value as AnalyticRule["triggerOperator"] })}
          >
            <option value="GreaterThan">Greater Than</option>
            <option value="LessThan">Less Than</option>
            <option value="Equal">Equal</option>
            <option value="NotEqual">Not Equal</option>
          </select>
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

      {availableConnectors.length > 0 && (
        <div>
          <Label>Required Data Connectors</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableConnectors.map((c) => (
              <label key={c.connectorId} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.requiredDataConnectors.some((r) => r.connectorId === c.connectorId)}
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
            Select which data connectors this rule depends on.
          </p>
        </div>
      )}

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

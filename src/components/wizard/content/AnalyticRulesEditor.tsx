import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PasteImportDialog } from "@/components/ui/paste-import-dialog"
import { Plus, ClipboardPaste } from "lucide-react"
import type { AnalyticRule } from "@/lib/schemas"
import { parseAnalyticRuleYaml } from "@/lib/yaml-import"
import { SEVERITY_COLORS } from "./analytic-rules/constants"
import { RuleItem } from "./analytic-rules/RuleItem"
import type { AvailableConnector } from "./analytic-rules/types"

export function AnalyticRulesEditor() {
  const { analyticRules, updateAnalyticRules, connectors } = useConnectorConfig()
  const [pasteDialogOpen, setPasteDialogOpen] = React.useState(false)

  const availableConnectors: AvailableConnector[] = connectors
    .filter((c) => c.meta.connectorId)
    .map((c) => ({
      connectorId: c.meta.connectorId,
      dataTypes: c.schema.tableName ? [c.schema.tableName] : [],
      label: c.meta.title || c.meta.connectorId,
    }))

  const handleImportYaml = React.useCallback(
    (text: string) => {
      const rule = parseAnalyticRuleYaml(text)
      updateAnalyticRules([...analyticRules, rule])
    },
    [analyticRules, updateAnalyticRules],
  )

  const addRule = () => {
    const newRule: AnalyticRule = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      severity: "Medium",
      kind: "Scheduled",
      queryPeriod: "PT5H",
      queryFrequency: "PT5H",
      triggerOperator: "GreaterThan",
      triggerThreshold: 0,
      tactics: [],
      relevantTechniques: [],
      query:
        connectors
          .map((c) => c.schema.tableName)
          .filter(Boolean)
          .join("\n| union ") + "\n| where TimeGenerated > ago(5h)\n",
      entityMappings: [],
      requiredDataConnectors: connectors
        .filter((c) => c.meta.connectorId)
        .map((c) => ({
          connectorId: c.meta.connectorId,
          dataTypes: c.schema.tableName ? [c.schema.tableName] : [],
        })),
      version: "1.0.0",
      enabled: true,
    }
    updateAnalyticRules([...analyticRules, newRule])
  }

  const updateRule = (index: number, updates: Partial<AnalyticRule>) => {
    const updated = [...analyticRules]
    updated[index] = { ...updated[index], ...updates }
    updateAnalyticRules(updated)
  }

  const removeRule = (index: number) => {
    updateAnalyticRules(analyticRules.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define analytic rules for threat detection in your solution.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPasteDialogOpen(true)}>
            <ClipboardPaste className="w-4 h-4 mr-1" /> Paste YAML
          </Button>
          <Button size="sm" onClick={addRule}>
            <Plus className="w-4 h-4 mr-1" /> Add Rule
          </Button>
        </div>
      </div>

      {analyticRules.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          No analytic rules yet. Click &quot;Add Rule&quot; to create one.
        </div>
      )}

      <Accordion type="multiple">
        {analyticRules.map((rule, ruleIndex) => (
          <AccordionItem key={rule.id} value={rule.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-2 text-left flex-1 mr-2">
                <span className="truncate">
                  {rule.name || `Rule ${ruleIndex + 1}`}
                </span>
                <Badge variant={SEVERITY_COLORS[rule.severity] || "default"}>
                  {rule.severity}
                </Badge>
                <Badge variant="outline">{rule.kind}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RuleItem
                rule={rule}
                availableConnectors={availableConnectors}
                onChange={(updates) => updateRule(ruleIndex, updates)}
                onRemove={() => removeRule(ruleIndex)}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <PasteImportDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        onImport={handleImportYaml}
        title="Import Analytic Rule from YAML"
        description="Paste a Sentinel analytic rule YAML definition. Fields like name, severity, query, tactics, and entity mappings will be imported automatically."
        placeholder={"id: ...\nname: My Detection Rule\nseverity: Medium\nkind: Scheduled\nquery: |\n  MyTable_CL\n  | where ..."}
      />
    </div>
  )
}

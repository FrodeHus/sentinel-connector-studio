import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { KqlEditor } from "@/components/kql-editor/KqlEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ClipboardPaste } from "lucide-react"
import type { HuntingQuery } from "@/lib/schemas"
import { parseHuntingQueryYaml } from "@/lib/yaml-import"
import { MITRE_TACTICS } from "./analytic-rules/constants"
import type { AvailableConnector } from "./analytic-rules/types"
import { RequiredDataConnectorsSelector } from "./analytic-rules/RequiredDataConnectorsSelector"

export function HuntingQueriesEditor() {
  const {
    connectors,
    huntingQueries,
    updateHuntingQueries,
  } = useConnectorConfig()
  const [pasteDialogOpen, setPasteDialogOpen] = React.useState(false)
  const [yamlText, setYamlText] = React.useState("")
  const [parseError, setParseError] = React.useState("")

  const availableConnectors = React.useMemo<AvailableConnector[]>(
    () =>
      connectors
        .filter((c) => c.meta.connectorId)
        .map((c) => ({
          connectorId: c.meta.connectorId,
          label: c.meta.title || c.meta.connectorId,
          dataTypes: c.schema.tableName ? [c.schema.tableName] : [],
        })),
    [connectors],
  )

  const addQuery = () => {
    const newQuery: HuntingQuery = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      tactics: [],
      relevantTechniques: [],
      query:
        connectors
          .map((c) => c.schema.tableName)
          .filter(Boolean)
          .join("\n| union ") + "\n| where TimeGenerated > ago(1d)\n",
      entityMappings: [],
      requiredDataConnectors: availableConnectors.map((c) => ({
        connectorId: c.connectorId,
        dataTypes: c.dataTypes,
      })),
      version: "1.0.0",
    }
    updateHuntingQueries([...huntingQueries, newQuery])
  }

  const updateQuery = (index: number, updates: Partial<HuntingQuery>) => {
    const updated = [...huntingQueries]
    updated[index] = { ...updated[index], ...updates }
    updateHuntingQueries(updated)
  }

  const removeQuery = (index: number) => {
    updateHuntingQueries(huntingQueries.filter((_, i) => i !== index))
  }

  const handleImportYaml = () => {
    setParseError("")
    try {
      const query = parseHuntingQueryYaml(yamlText)
      updateHuntingQueries([...huntingQueries, query])
      setYamlText("")
      setPasteDialogOpen(false)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse YAML")
    }
  }

  const handlePasteDialogClose = (open: boolean) => {
    if (!open) {
      setYamlText("")
      setParseError("")
    }
    setPasteDialogOpen(open)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add proactive hunting queries to help analysts investigate suspicious activity.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPasteDialogOpen(true)}>
            <ClipboardPaste className="w-4 h-4 mr-1" /> Paste YAML
          </Button>
          <Button size="sm" onClick={addQuery}>
            <Plus className="w-4 h-4 mr-1" /> Add Query
          </Button>
        </div>
      </div>

      {huntingQueries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          No hunting queries yet. Click "Add Query" to create one.
        </div>
      )}

      <Accordion type="multiple">
        {huntingQueries.map((query, queryIndex) => (
          <AccordionItem key={query.id} value={query.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-2 text-left flex-1 mr-2">
                <span className="truncate">
                  {query.name || `Hunting Query ${queryIndex + 1}`}
                </span>
                <Badge variant="outline">Hunt</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={query.name}
                    onChange={(e) => updateQuery(queryIndex, { name: e.target.value })}
                    placeholder="Suspicious PowerShell Activity"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={query.description}
                    onChange={(e) => updateQuery(queryIndex, { description: e.target.value })}
                    placeholder="Describe what this hunting query looks for..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>MITRE Tactics</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!query.tactics.includes(value)) {
                          updateQuery(queryIndex, { tactics: [...query.tactics, value] })
                        }
                      }}
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Add tactic..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MITRE_TACTICS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {query.tactics.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {query.tactics.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            updateQuery(queryIndex, {
                              tactics: query.tactics.filter((x) => x !== t),
                            })
                          }
                        >
                          <Badge variant="secondary">{t}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Relevant Techniques (comma-separated)</Label>
                  <Input
                    value={query.relevantTechniques.join(", ")}
                    onChange={(e) =>
                      updateQuery(queryIndex, {
                        relevantTechniques: e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="T1059, T1105"
                  />
                </div>
                <RequiredDataConnectorsSelector
                  availableConnectors={availableConnectors}
                  selectedConnectors={query.requiredDataConnectors}
                  onChange={(requiredDataConnectors) =>
                    updateQuery(queryIndex, { requiredDataConnectors })
                  }
                />
                <div>
                  <Label>Query (KQL)</Label>
                  <KqlEditor
                    value={query.query}
                    onChange={(value) => updateQuery(queryIndex, { query: value })}
                    mode="full"
                    showSnippets={false}
                    height="200px"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Version</Label>
                    <Input
                      value={query.version}
                      onChange={(e) => updateQuery(queryIndex, { version: e.target.value })}
                      placeholder="1.0.0"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeQuery(queryIndex)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete Query
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog open={pasteDialogOpen} onOpenChange={handlePasteDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Hunting Query from YAML</DialogTitle>
            <DialogDescription>
              Paste a Sentinel hunting query YAML definition. The name, description, tactics, techniques, and query fields will be imported.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={"id: ...\nname: Suspicious Activity Hunt\nquery: |\n  MyTable_CL\n  | where ..."}
              rows={12}
              value={yamlText}
              onChange={(e) => setYamlText(e.target.value)}
              className="font-mono text-sm"
            />
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePasteDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportYaml} disabled={!yamlText.trim()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

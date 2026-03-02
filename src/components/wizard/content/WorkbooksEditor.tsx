import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PasteImportDialog } from "@/components/ui/paste-import-dialog"
import { Plus, Trash2, ClipboardPaste, RefreshCw } from "lucide-react"
import type { Workbook } from "@/lib/schemas"
import { updateAtIndex } from "@/lib/array-utils"

function deriveTemplateId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return slug ? `sentinel-${slug}` : ""
}

function summarizeWorkbookJson(json: string): { itemCount: number; isValid: boolean } {
  try {
    const parsed = JSON.parse(json)
    const items = Array.isArray(parsed.items) ? parsed.items.length : 0
    return { itemCount: items, isValid: true }
  } catch {
    return { itemCount: 0, isValid: false }
  }
}

export function WorkbooksEditor() {
  const { workbooks, updateWorkbooks } = useConnectorConfig()
  const [pasteDialogOpen, setPasteDialogOpen] = React.useState(false)
  const [pasteTarget, setPasteTarget] = React.useState<number | null>(null)

  const handlePasteDialogClose = (open: boolean) => {
    if (!open) {
      setPasteTarget(null)
    }
    setPasteDialogOpen(open)
  }

  const handleImportJson = React.useCallback(
    (text: string) => {
      const parsed = JSON.parse(text)
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Invalid JSON: expected an object")
      }

      if (pasteTarget !== null) {
        updateWorkbooks(
          updateAtIndex(workbooks, pasteTarget, {
            serializedData: text,
            fromTemplateId: parsed.fromTemplateId || workbooks[pasteTarget].fromTemplateId,
          }),
        )
      } else {
        const name = parsed.name || ""
        const newWorkbook: Workbook = {
          id: crypto.randomUUID(),
          name,
          description: "",
          fromTemplateId: parsed.fromTemplateId || deriveTemplateId(name),
          serializedData: text,
          version: parsed.version || "1.0",
        }
        updateWorkbooks([...workbooks, newWorkbook])
      }

      setPasteTarget(null)
    },
    [pasteTarget, workbooks, updateWorkbooks],
  )

  const addWorkbook = () => {
    const newWorkbook: Workbook = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      fromTemplateId: "",
      serializedData: "",
      version: "1.0",
    }
    updateWorkbooks([...workbooks, newWorkbook])
  }

  const updateWorkbook = (index: number, updates: Partial<Workbook>) => {
    const updated = [...workbooks]
    updated[index] = { ...updated[index], ...updates }
    updateWorkbooks(updated)
  }

  const handleNameChange = (index: number, name: string) => {
    const wb = workbooks[index]
    const updates: Partial<Workbook> = { name }
    // Auto-derive templateId if it was empty or matched the old derived value
    const oldDerived = deriveTemplateId(wb.name)
    if (!wb.fromTemplateId || wb.fromTemplateId === oldDerived) {
      updates.fromTemplateId = deriveTemplateId(name)
    }
    updateWorkbook(index, updates)
  }

  const removeWorkbook = (index: number) => {
    updateWorkbooks(workbooks.filter((_, i) => i !== index))
  }

  const openReplaceDialog = (index: number) => {
    setPasteTarget(index)
    setPasteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add Azure Monitor Workbooks (gallery template JSON) to your solution.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPasteTarget(null)
              setPasteDialogOpen(true)
            }}
          >
            <ClipboardPaste className="w-4 h-4 mr-1" /> Paste JSON
          </Button>
          <Button size="sm" onClick={addWorkbook}>
            <Plus className="w-4 h-4 mr-1" /> Add Workbook
          </Button>
        </div>
      </div>

      {workbooks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          No workbooks yet. Click &quot;Paste JSON&quot; to import a gallery template or &quot;Add Workbook&quot; to create one.
        </div>
      )}

      <Accordion type="multiple">
        {workbooks.map((wb, wbIndex) => {
          const summary = wb.serializedData
            ? summarizeWorkbookJson(wb.serializedData)
            : null

          return (
            <AccordionItem key={wb.id} value={wb.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-2 text-left flex-1 mr-2">
                  <span className="truncate">
                    {wb.name || `Workbook ${wbIndex + 1}`}
                  </span>
                  {summary?.isValid && (
                    <Badge variant="outline">
                      {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {wb.serializedData && !summary?.isValid && (
                    <Badge variant="destructive">Invalid JSON</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={wb.name}
                      onChange={(e) => handleNameChange(wbIndex, e.target.value)}
                      placeholder="e.g. Cloudflare Overview"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={wb.description}
                      onChange={(e) =>
                        updateWorkbook(wbIndex, { description: e.target.value })
                      }
                      placeholder="Brief description of the workbook"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Template ID</Label>
                      <Input
                        value={wb.fromTemplateId}
                        onChange={(e) =>
                          updateWorkbook(wbIndex, {
                            fromTemplateId: e.target.value,
                          })
                        }
                        placeholder="sentinel-workbook-name"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-derived from name as sentinel-&lt;name&gt;
                      </p>
                    </div>
                    <div>
                      <Label>Version</Label>
                      <Input
                        value={wb.version}
                        onChange={(e) =>
                          updateWorkbook(wbIndex, { version: e.target.value })
                        }
                        placeholder="1.0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Gallery Template JSON</Label>
                    {wb.serializedData ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {(wb.serializedData.length / 1024).toFixed(1)} KB
                        </Badge>
                        {summary?.isValid && (
                          <span className="text-xs text-muted-foreground">
                            {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReplaceDialog(wbIndex)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Replace JSON
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => openReplaceDialog(wbIndex)}
                      >
                        <ClipboardPaste className="w-4 h-4 mr-1" /> Paste JSON
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeWorkbook(wbIndex)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete Workbook
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <PasteImportDialog
        open={pasteDialogOpen}
        onOpenChange={handlePasteDialogClose}
        onImport={handleImportJson}
        title={pasteTarget !== null ? "Replace Workbook JSON" : "Import Workbook from JSON"}
        description="Paste the gallery template JSON exported from an Azure Monitor Workbook."
        placeholder={'{\n  "$schema": "...",\n  "version": "Notebook/1.0",\n  "items": [...]\n}'}
        importLabel={pasteTarget !== null ? "Replace" : "Import"}
        initialValue={pasteTarget !== null ? workbooks[pasteTarget]?.serializedData ?? "" : ""}
      />
    </div>
  )
}

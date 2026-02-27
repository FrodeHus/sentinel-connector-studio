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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, ClipboardPaste, RefreshCw } from "lucide-react"
import type { Workbook } from "@/lib/schemas"

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
  const [jsonText, setJsonText] = React.useState("")
  const [parseError, setParseError] = React.useState("")

  const handlePasteDialogClose = (open: boolean) => {
    if (!open) {
      setJsonText("")
      setParseError("")
      setPasteTarget(null)
    }
    setPasteDialogOpen(open)
  }

  const handleImportJson = () => {
    setParseError("")
    try {
      const parsed = JSON.parse(jsonText)
      if (typeof parsed !== "object" || parsed === null) {
        setParseError("Invalid JSON: expected an object")
        return
      }

      if (pasteTarget !== null) {
        // Replace existing workbook JSON
        const updated = [...workbooks]
        updated[pasteTarget] = {
          ...updated[pasteTarget],
          serializedData: jsonText,
          fromTemplateId: parsed.fromTemplateId || updated[pasteTarget].fromTemplateId,
        }
        updateWorkbooks(updated)
      } else {
        // New workbook from pasted JSON
        const name = parsed.name || ""
        const newWorkbook: Workbook = {
          id: crypto.randomUUID(),
          name,
          description: "",
          fromTemplateId: parsed.fromTemplateId || deriveTemplateId(name),
          serializedData: jsonText,
          version: parsed.version || "1.0",
        }
        updateWorkbooks([...workbooks, newWorkbook])
      }

      setJsonText("")
      setPasteTarget(null)
      setPasteDialogOpen(false)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse JSON")
    }
  }

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
    setJsonText(workbooks[index].serializedData)
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

      <Dialog open={pasteDialogOpen} onOpenChange={handlePasteDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {pasteTarget !== null ? "Replace Workbook JSON" : "Import Workbook from JSON"}
            </DialogTitle>
            <DialogDescription>
              Paste the gallery template JSON exported from an Azure Monitor Workbook.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={'{\n  "$schema": "...",\n  "version": "Notebook/1.0",\n  "items": [...]\n}'}
              rows={14}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-sm"
            />
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handlePasteDialogClose(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleImportJson} disabled={!jsonText.trim()}>
              {pasteTarget !== null ? "Replace" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

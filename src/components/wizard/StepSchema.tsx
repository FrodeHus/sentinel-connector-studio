import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { SchemaEditor } from "@/components/schema-editor/SchemaEditor"
import { PasteJsonDialog } from "@/components/schema-editor/PasteJsonDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ClipboardPaste, HelpCircle } from "lucide-react"
import type { Column } from "@/lib/schemas"

export function StepSchema() {
  const { config, updateSchema } = useConnectorConfig()
  const { schema } = config
  const [pasteDialogOpen, setPasteDialogOpen] = React.useState(false)

  const handleColumnsChange = React.useCallback(
    (columns: Column[]) => updateSchema({ columns }),
    [updateSchema],
  );

  const handleOpenPasteDialog = React.useCallback(
    () => setPasteDialogOpen(true),
    [],
  );

  const handleApplyInferred = React.useCallback(
    (columns: Column[]) => {
      const timeGenerated = schema.columns.find(
        (c) => c.name === "TimeGenerated",
      );
      updateSchema({
        columns: [
          timeGenerated || { name: "TimeGenerated", type: "datetime" as const },
          ...columns,
        ],
      });
    },
    [schema.columns, updateSchema],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Table Schema</CardTitle>
          <CardDescription>
            Define the custom Log Analytics table where ingested data will be
            stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableName">Table Name *</Label>
            <Input
              id="tableName"
              placeholder="e.g., ContosoSecurityAlerts_CL"
              value={schema.tableName}
              onChange={(e) => updateSchema({ tableName: e.target.value })}
            />
            {schema.tableName && !schema.tableName.endsWith("_CL") && (
              <p className="text-xs text-destructive">
                Table name must end with _CL
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Custom tables in Log Analytics must end with &quot;_CL&quot;.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Columns</Label>
            <Button variant="outline" size="sm" onClick={handleOpenPasteDialog}>
              <ClipboardPaste className="w-4 h-4 mr-1" /> Paste sample event
            </Button>
          </div>

          <SchemaEditor
            columns={schema.columns}
            onChange={handleColumnsChange}
          />
        </CardContent>
      </Card>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <HelpCircle className="w-4 h-4" />
          What is this step about?
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
              <p>
                This table is where your data lands in Log Analytics. Think of
                columns as the fields in your events.
              </p>
              <p>
                <strong>Tip:</strong> Paste a sample JSON event from your
                application to auto-generate the schema.
              </p>
              <p>
                Column types: <strong>string</strong> (text),{" "}
                <strong>long</strong> (integer), <strong>real</strong>{" "}
                (decimal), <strong>bool</strong> (true/false),{" "}
                <strong>datetime</strong> (timestamp), <strong>dynamic</strong>{" "}
                (JSON object/array), <strong>guid</strong> (UUID).
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <PasteJsonDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        onApply={handleApplyInferred}
      />
    </div>
  );
}

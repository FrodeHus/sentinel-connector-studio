import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { SchemaEditor } from "@/components/schema-editor/SchemaEditor"
import { PasteJsonDialog } from "@/components/schema-editor/PasteJsonDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardPaste } from "lucide-react"
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

      <PasteJsonDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        onApply={handleApplyInferred}
      />
    </div>
  );
}

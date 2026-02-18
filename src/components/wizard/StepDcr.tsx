import * as React from "react";
import { useConnectorConfig } from "@/hooks/useConnectorConfig";
import { KqlEditor } from "@/components/kql-editor/KqlEditor";
import { SchemaEditor } from "@/components/schema-editor/SchemaEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HelpCircle } from "lucide-react";
import type { Column } from "@/lib/schemas";

export function StepDcr() {
  const { config, updateDataFlow } = useConnectorConfig();
  const { dataFlow } = config;

  const handleTransformKqlChange = React.useCallback(
    (transformKql: string) => updateDataFlow({ transformKql }),
    [updateDataFlow],
  );

  const handleInputColumnsChange = React.useCallback(
    (inputColumns: Column[]) => updateDataFlow({ inputColumns }),
    [updateDataFlow],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Collection Rule</CardTitle>
          <CardDescription>
            Configure how data flows from the push endpoint to your table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streamName">Stream Name *</Label>
            <Input
              id="streamName"
              placeholder="e.g., Custom-ContosoSecurityAlerts"
              value={dataFlow.streamName}
              onChange={(e) => updateDataFlow({ streamName: e.target.value })}
            />
            {dataFlow.streamName &&
              !dataFlow.streamName.startsWith("Custom-") && (
                <p className="text-xs text-destructive">
                  Stream name must start with &quot;Custom-&quot;
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label>Transform KQL *</Label>
            <KqlEditor
              value={dataFlow.transformKql}
              onChange={handleTransformKqlChange}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="inputColumnsOverride"
                checked={dataFlow.inputColumnsOverride}
                onChange={(e) =>
                  updateDataFlow({ inputColumnsOverride: e.target.checked })
                }
                className="rounded border-input"
              />
              <Label htmlFor="inputColumnsOverride" className="cursor-pointer">
                Input columns differ from table schema
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Enable this if your application sends data with different field
              names than the table columns. The KQL transform handles the
              mapping.
            </p>

            {dataFlow.inputColumnsOverride && (
              <div className="pl-4 border-l-2 border-muted">
                <Label className="mb-2 block">Input Stream Columns</Label>
                <SchemaEditor
                  columns={dataFlow.inputColumns}
                  onChange={handleInputColumnsChange}
                />
              </div>
            )}
          </div>
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
                The DCR acts as a pipeline: data comes in from your app, gets
                transformed, and lands in the table.
              </p>
              <p>
                If your app already sends a <code>TimeGenerated</code> field,
                use <code>source</code> as the transform. Otherwise, the default
                adds it automatically.
              </p>
              <p>
                The <strong>stream name</strong> is used by your application
                when sending data to the ingestion endpoint.
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

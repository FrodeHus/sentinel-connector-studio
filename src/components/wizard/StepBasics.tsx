import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { titleToConnectorId, connectorIdToTableName, tableNameToStreamName } from "@/lib/naming"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { HelpCircle } from "lucide-react"

export function StepBasics() {
  const { config, updateMeta, updateSchema, updateDataFlow } = useConnectorConfig()
  const { meta, schema, dataFlow } = config
  const [idManuallyEdited, setIdManuallyEdited] = React.useState(false)

  const handleTitleChange = (title: string) => {
    const newConnectorId = titleToConnectorId(title)
    const newTableName = connectorIdToTableName(newConnectorId)
    const newStreamName = tableNameToStreamName(newTableName)

    if (!idManuallyEdited) {
      updateMeta({ title, connectorId: newConnectorId })
    } else {
      updateMeta({ title })
    }

    // Auto-derive table name if empty or still matching the previous auto-derived value
    const oldTableName = connectorIdToTableName(meta.connectorId)
    if (!schema.tableName || schema.tableName === oldTableName) {
      updateSchema({ tableName: newTableName })
    }

    // Auto-derive stream name if empty or still matching the previous auto-derived value
    const oldStreamName = tableNameToStreamName(oldTableName)
    if (!dataFlow.streamName || dataFlow.streamName === oldStreamName) {
      updateDataFlow({ streamName: newStreamName })
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connector Identity</CardTitle>
          <CardDescription>
            Define how your connector appears in the Sentinel data connector gallery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder='e.g., "Contoso Security Alerts (Push)"'
              value={meta.title}
              onChange={e => handleTitleChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The display name users see when browsing connectors in Sentinel.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="connectorId">Connector ID *</Label>
            <Input
              id="connectorId"
              placeholder="e.g., ContosoSecurityAlerts"
              value={meta.connectorId}
              onChange={e => {
                setIdManuallyEdited(true)
                updateMeta({ connectorId: e.target.value })
              }}
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated from title. Used as the internal resource name. Must start with a letter, alphanumeric only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher *</Label>
            <Input
              id="publisher"
              placeholder="e.g., Contoso Ltd."
              value={meta.publisher}
              onChange={e => updateMeta({ publisher: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Markdown) *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this connector does and what data it ingests..."
              rows={5}
              value={meta.descriptionMarkdown}
              onChange={e => updateMeta({ descriptionMarkdown: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Supports Markdown. Shown on the connector page in Sentinel. Link to your product docs.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo (SVG, optional)</Label>
            <Textarea
              id="logo"
              placeholder="Paste SVG markup here..."
              rows={3}
              value={meta.logo}
              onChange={e => updateMeta({ logo: e.target.value })}
            />
            {meta.logo && (
              <div className="p-4 border rounded-md bg-muted flex items-center justify-center">
                <div
                  className="w-16 h-16"
                  dangerouslySetInnerHTML={{ __html: meta.logo }}
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
              <p>This step captures the identity and branding of your connector. The information here determines how your connector appears in the Sentinel Data Connector gallery.</p>
              <p><strong>Title</strong> is the main display name users see. Make it descriptive, e.g., &quot;Contoso Security Alerts (Push)&quot;.</p>
              <p><strong>Publisher</strong> is shown as the author of the connector.</p>
              <p><strong>Description</strong> supports Markdown and appears on the connector&apos;s detail page. Include links to your product documentation.</p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

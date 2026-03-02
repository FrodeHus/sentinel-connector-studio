import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { CONFIG } from "@/config";
import { generateTableResource } from "@/lib/arm-resources/table";
import { generateDcrResource } from "@/lib/arm-resources/dcr";
import { generateConnectorDefinition } from "@/lib/arm-resources/connector-def";
import { generateDataConnector } from "@/lib/arm-resources/data-connector";
import { connectorIdToDcrName } from "@/lib/naming";
import { highlightJson } from "@/lib/highlight";
import { SafeHtmlSpan } from "@/components/ui/safe-html";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";

const FILE_TABS = [
  "table.json",
  "DCR.json",
  "connectorDefinition.json",
  "dataConnector.json",
] as const;
type FileTab = (typeof FILE_TABS)[number];

export function ArmTemplatePreview() {
  const { config } = useConnectorConfig();
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<FileTab>("table.json");
  const content = React.useMemo<Record<FileTab, string>>(() => {
    try {
      const { meta, schema, dataFlow, connectorUI } = config;
      const dcrName = connectorIdToDcrName(meta.connectorId, meta.connectorKind);
      return {
        "table.json": JSON.stringify(generateTableResource(schema, ""), null, 2),
        "DCR.json": JSON.stringify(generateDcrResource(schema, dataFlow, dcrName), null, 2),
        "connectorDefinition.json": JSON.stringify(generateConnectorDefinition(meta, schema, connectorUI), null, 2),
        "dataConnector.json": JSON.stringify(generateDataConnector(meta, dataFlow, config.pollerConfig), null, 2),
      };
    } catch (error) {
      const msg = `// Error generating template:\n// ${error instanceof Error ? error.message : String(error)}`;
      return {
        "table.json": msg,
        "DCR.json": msg,
        "connectorDefinition.json": msg,
        "dataConnector.json": msg,
      };
    }
  }, [config]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), CONFIG.COPY_FEEDBACK_DURATION_MS);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Clipboard API might not be available
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FileTab)} className="h-full flex flex-col">
    <Card className="h-full flex flex-col border-t-2 border-t-primary/50 shadow-lg">
      <CardHeader className="pb-3 shrink-0 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            File Preview
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <TabsList className="mt-2 h-auto flex-wrap justify-start gap-1 bg-transparent border-0 p-0">
          {FILE_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="px-2 py-1 text-xs font-mono rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 pb-5 px-5 pt-4">
        <div className="h-full rounded-lg border border-border/50 bg-card/30 overflow-auto">
          <pre className="p-4 text-xs font-mono leading-relaxed">
            <code>{content[activeTab].split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="inline-block w-8 shrink-0 text-right pr-3 select-none text-muted-foreground/50">{i + 1}</span>
                <SafeHtmlSpan html={highlightJson(line)} />
              </div>
            ))}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
    </Tabs>
  );
}

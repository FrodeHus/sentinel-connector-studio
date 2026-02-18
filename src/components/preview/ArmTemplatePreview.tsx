import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { generateTableResource } from "@/lib/arm-resources/table";
import { generateDcrResource } from "@/lib/arm-resources/dcr";
import { generateConnectorDefinition } from "@/lib/arm-resources/connector-def";
import { generateDataConnector } from "@/lib/arm-resources/data-connector";
import { connectorIdToDcrName } from "@/lib/naming";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [content, setContent] = React.useState<Record<FileTab, string>>({
    "table.json": "",
    "DCR.json": "",
    "connectorDefinition.json": "",
    "dataConnector.json": "",
  });

  React.useEffect(() => {
    try {
      const { meta, schema, dataFlow, connectorUI } = config;
      const dcrName = connectorIdToDcrName(meta.connectorId);
      setContent({
        "table.json": JSON.stringify(
          generateTableResource(schema, ""),
          null,
          2,
        ),
        "DCR.json": JSON.stringify(
          generateDcrResource(schema, dataFlow, dcrName),
          null,
          2,
        ),
        "connectorDefinition.json": JSON.stringify(
          generateConnectorDefinition(meta, schema, connectorUI),
          null,
          2,
        ),
        "dataConnector.json": JSON.stringify(
          generateDataConnector(meta, dataFlow),
          null,
          2,
        ),
      });
    } catch (error) {
      const msg = `// Error generating template:\n// ${error instanceof Error ? error.message : String(error)}`;
      setContent({
        "table.json": msg,
        "DCR.json": msg,
        "connectorDefinition.json": msg,
        "dataConnector.json": msg,
      });
    }
  }, [config]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available
    }
  };

  return (
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
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex gap-1 flex-wrap mt-2">
          {FILE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 text-xs rounded font-mono transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 pb-5 px-5 pt-4">
        <div className="h-full rounded-lg border border-border/50 bg-[rgba(15,11,36,0.3)] overflow-auto">
          <pre className="p-4 text-xs font-mono leading-relaxed">
            <code>{content[activeTab]}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

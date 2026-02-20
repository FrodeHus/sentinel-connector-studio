import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { downloadSolutionZip, downloadIndividualFile } from "@/lib/download";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import {
  Download,
  FolderArchive,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

export function StepExport() {
  const {
    config,
    connectors,
    activeConnectorIndex,
    updateSolution,
  } = useConnectorConfig();
  const { solution } = config;
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Use the <strong>File menu</strong> (
          <span className="inline-flex items-center gap-1">
            <svg
              className="inline w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </span>
          ) in the header to save or load your project configuration at any
          time. Keyboard shortcuts:{" "}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘S</kbd> to
          save, <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘O</kbd>{" "}
          to open.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solution Metadata</CardTitle>
          <CardDescription>
            Finalize packaging metadata for Sentinel Content Hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="solutionName">Solution Name</Label>
            <Input
              id="solutionName"
              placeholder="e.g., ContosoSecuritySolution"
              value={solution.name}
              onChange={(e) => updateSolution({ name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Name used for the solution package folder. Defaults to the first
              connector ID if empty.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publisherId">Publisher ID *</Label>
              <Input
                id="publisherId"
                placeholder="contoso"
                value={solution.publisherId}
                onChange={(e) =>
                  updateSolution({ publisherId: e.target.value.toLowerCase() })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, no spaces. Used in Content Hub.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offerId">Offer ID *</Label>
              <Input
                id="offerId"
                placeholder="contoso-security-alerts"
                value={solution.offerId}
                onChange={(e) =>
                  updateSolution({ offerId: e.target.value.toLowerCase() })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with hyphens. Globally unique.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                value={solution.version}
                onChange={(e) => updateSolution({ version: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportTier">Support Tier *</Label>
              <select
                id="supportTier"
                title="Select support tier"
                value={solution.support.tier}
                onChange={(e) =>
                  updateSolution({
                    support: {
                      ...solution.support,
                      tier: e.target.value as
                        | "Microsoft"
                        | "Partner"
                        | "Community",
                    },
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Microsoft">Microsoft</option>
                <option value="Partner">Partner</option>
                <option value="Community">Community</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportName">Support Name *</Label>
            <Input
              id="supportName"
              placeholder="Contoso Support"
              value={solution.support.name}
              onChange={(e) =>
                updateSolution({
                  support: { ...solution.support, name: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email *</Label>
            <Input
              id="supportEmail"
              type="email"
              placeholder="support@contoso.com"
              value={solution.support.email}
              onChange={(e) =>
                updateSolution({
                  support: { ...solution.support, email: e.target.value },
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Used in the solution Author field for Content Hub.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportLink">Support Link</Label>
            <Input
              id="supportLink"
              placeholder="https://support.contoso.com"
              value={solution.support.link}
              onChange={(e) =>
                updateSolution({
                  support: { ...solution.support, link: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download</CardTitle>
          <CardDescription>
            Export your connector files for packaging with the Azure-Sentinel
            packaging tool.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() =>
              downloadSolutionZip({
                solution: config.solution,
                connectors,
                activeConnectorIndex,
              })
            }
            className="w-full justify-start"
            size="lg"
          >
            <FolderArchive className="w-5 h-5 mr-2" />
            Download Solution Package (ZIP)
          </Button>
          <p className="text-xs text-muted-foreground">
            Full folder structure for the Azure-Sentinel{" "}
            <code>createSolutionV3.ps1</code> packaging tool. Run the packaging
            script after extracting to generate the deployable{" "}
            <code>mainTemplate.json</code>.
          </p>

          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 cursor-pointer">
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
              Download individual files
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => downloadIndividualFile("table", config)}
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  table.json
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => downloadIndividualFile("dcr", config)}
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  DCR.json
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => downloadIndividualFile("connectorDef", config)}
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  connectorDefinition.json
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() =>
                    downloadIndividualFile("dataConnector", config)
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  dataConnector.json
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              1. Clone the Azure-Sentinel repository
            </h4>
            <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
              {`git clone https://github.com/<YOUR_FORK>/Azure-Sentinel.git`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              2. Extract the ZIP into Solutions/
            </h4>
            <p>
              Extract the downloaded ZIP so that your connector folder is placed
              at:
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto mt-1">
              {`Azure-Sentinel/Solutions/<ConnectorName>/`}
            </pre>
            <p className="mt-1">
              Update <code>BasePath</code> in <code>Data/Solution_*.json</code>{" "}
              to point to your local path.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              3. Run the packaging script
            </h4>
            <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
              {`cd Tools/Create-Azure-Sentinel-Solution/V3\n.\\createSolutionV3.ps1`}
            </pre>
            <p className="mt-1">
              When prompted, enter the absolute path to your <code>Data/</code>{" "}
              folder. The script generates{" "}
              <code>Package/mainTemplate.json</code>.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              4. Deploy via Azure Portal
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Navigate to{" "}
                <a
                  href="https://portal.azure.com/#create/Microsoft.Template"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Deploy a custom template
                </a>
              </li>
              <li>Click &quot;Build your own template in the editor&quot;</li>
              <li>
                Upload the generated <code>Package/mainTemplate.json</code>
              </li>
              <li>Select your subscription, resource group, and workspace</li>
              <li>Review and create</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              5. Enable the connector in Sentinel
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Find your connector in Sentinel Data Connectors gallery</li>
              <li>
                Click &quot;Deploy&quot; to provision the push endpoint and
                Entra app
              </li>
              <li>
                Copy the connection credentials shown on the connector page
              </li>
              <li>
                Configure your application to send data to the ingestion
                endpoint
              </li>
            </ul>
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
                This final step packages your connector for deployment to Azure.
              </p>
              <p>
                The <strong>solution package (ZIP)</strong> contains the
                individual resource files (<code>table.json</code>,{" "}
                <code>DCR.json</code>, <code>connectorDefinition.json</code>,{" "}
                <code>dataConnector.json</code>) and solution metadata needed by
                the Azure-Sentinel packaging tool.
              </p>
              <p>
                Run <code>createSolutionV3.ps1</code> from the Azure-Sentinel
                repository to generate the deployable{" "}
                <code>mainTemplate.json</code> from these files.
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

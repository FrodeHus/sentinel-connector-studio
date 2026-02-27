import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import {
  downloadSolutionZip,
  downloadIndividualFile,
  buildSolutionZip,
  submitPackagingJob,
  pollJobStatus,
  downloadJobResult,
  checkPackagerHealth,
} from "@/lib/download";
import { saveAs } from "file-saver";
import { Badge } from "@/components/ui/badge";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Download,
  FolderArchive,
  ChevronDown,
  HelpCircle,
  Hammer,
  Loader2,
  CheckCircle2,
  XCircle,
  Terminal,
  Globe,
} from "lucide-react";

function DeploymentSteps({ templatePath }: { templatePath: string }) {
  const [deployTab, setDeployTab] = React.useState("portal");

  return (
    <Tabs value={deployTab} onValueChange={setDeployTab}>
      <TabsList>
        <TabsTrigger value="portal">
          <Globe className="w-3.5 h-3.5 mr-1.5" />
          Azure Portal
        </TabsTrigger>
        <TabsTrigger value="cli">
          <Terminal className="w-3.5 h-3.5 mr-1.5" />
          Azure CLI
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="portal"
        className="space-y-3 text-sm text-muted-foreground"
      >
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
            Upload <code>{templatePath}</code>
          </li>
          <li>Select your subscription, resource group, and workspace</li>
          <li>Review and create</li>
        </ol>
      </TabsContent>

      <TabsContent
        value="cli"
        className="space-y-3 text-sm text-muted-foreground"
      >
        <p>
          Deploy using the Azure CLI. Make sure you are logged in with{" "}
          <code>az login</code> first.
        </p>
        <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto whitespace-pre">
          {`# Create or use an existing resource group
az group create \\
  --name <RESOURCE_GROUP> \\
  --location <LOCATION>

# Deploy the template
az deployment group create \\
  --resource-group <RESOURCE_GROUP> \\
  --template-file ${templatePath} \\
  --parameters workspace=<WORKSPACE_NAME>`}
        </pre>
        <p>
          The <code>workspace</code> parameter is required. Supply it using the{" "}
          <code>--parameters</code> option as shown above.
        </p>
      </TabsContent>
    </Tabs>
  );
}

function NextStepsCard({ usedPackager }: { usedPackager: boolean }) {
  const stepOffset = usedPackager ? 1 : 3;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          {usedPackager && (
            <CardDescription>
              Your solution ZIP already contains{" "}
              <code>Package/mainTemplate.json</code> — skip straight to
              deployment.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {!usedPackager && (
            <>
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
                  Extract the downloaded ZIP so that your connector folder is
                  placed at:
                </p>
                <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto mt-1">
                  {`Azure-Sentinel/Solutions/<ConnectorName>/`}
                </pre>
                <p className="mt-1">
                  Update <code>BasePath</code> in{" "}
                  <code>Data/Solution_*.json</code> to point to your local path.
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
                  When prompted, enter the absolute path to your{" "}
                  <code>Data/</code> folder. The script generates{" "}
                  <code>Package/mainTemplate.json</code>.
                </p>
              </div>
            </>
          )}

          {usedPackager && (
            <div>
              <h4 className="font-medium text-foreground mb-2">
                1. Extract the downloaded ZIP
              </h4>
              <p>
                The ZIP contains your full solution directory including the
                generated <code>Package/mainTemplate.json</code>.
              </p>
            </div>
          )}

          <div>
            <h4 className="font-medium text-foreground mb-2">
              {stepOffset + 1}. Deploy to Azure
            </h4>
            <DeploymentSteps templatePath="Package/mainTemplate.json" />
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              {stepOffset + 2}. Enable the connector in Sentinel
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
              {usedPackager ? (
                <p>
                  You used the <strong>Build Deployable Template</strong>{" "}
                  option, which ran <code>createSolutionV3.ps1</code>{" "}
                  automatically. Your downloaded ZIP already contains the
                  deployable <code>mainTemplate.json</code> and{" "}
                  <code>createUiDefinition.json</code> in the{" "}
                  <code>Package/</code> directory.
                </p>
              ) : (
                <>
                  <p>
                    The <strong>solution package (ZIP)</strong> contains the
                    individual resource files (<code>table.json</code>,{" "}
                    <code>DCR.json</code>, <code>connectorDefinition.json</code>
                    , <code>dataConnector.json</code>) and solution metadata
                    needed by the Azure-Sentinel packaging tool.
                  </p>
                  <p>
                    Run <code>createSolutionV3.ps1</code> from the
                    Azure-Sentinel repository to generate the deployable{" "}
                    <code>mainTemplate.json</code> from these files.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}

export function StepExport() {
  const {
    config,
    connectors,
    activeConnectorIndex,
    analyticRules,
    huntingQueries,
    asimParsers,
    workbooks,
  } = useConnectorConfig();
  const [expanded, setExpanded] = React.useState(false);

  // Packager availability
  const [packagerOnline, setPackagerOnline] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    checkPackagerHealth().then(setPackagerOnline);
  }, []);

  // Packaging state
  const [packagingStatus, setPackagingStatus] = React.useState<
    "idle" | "submitting" | "queued" | "running" | "completed" | "failed" | "unavailable"
  >("idle");
  const [packagingError, setPackagingError] = React.useState<string | null>(null);
  const abortRef = React.useRef(false);

  const handleBuildTemplate = React.useCallback(async () => {
    abortRef.current = false;
    setPackagingStatus("submitting");
    setPackagingError(null);

    try {
      const blob = await buildSolutionZip({
        solution: config.solution,
        connectors,
        activeConnectorIndex,
        analyticRules,
        huntingQueries,
        asimParsers,
        workbooks,
      });

      if (abortRef.current) return;

      let job;
      try {
        job = await submitPackagingJob(blob);
      } catch (err) {
        setPackagingStatus("unavailable");
        setPackagingError(
          err instanceof TypeError
            ? "Packager sidecar is not running. Start it with: docker compose up packager"
            : String(err instanceof Error ? err.message : err),
        );
        return;
      }

      if (abortRef.current) return;
      setPackagingStatus("queued");

      // Poll until terminal state
      const { job_id, token } = job;
      while (!abortRef.current) {
        await new Promise((r) => setTimeout(r, 2000));
        if (abortRef.current) return;

        const status = await pollJobStatus(job_id, token);
        setPackagingStatus(status.status);

        if (status.status === "completed") {
          const resultBlob = await downloadJobResult(job_id, token);
          saveAs(resultBlob, "deployable-template.zip");
          return;
        }

        if (status.status === "failed") {
          setPackagingError(status.error || "Packaging failed");
          return;
        }
      }
    } catch (err) {
      setPackagingStatus("failed");
      setPackagingError(String(err instanceof Error ? err.message : err));
    }
  }, [config.solution, connectors, activeConnectorIndex, analyticRules, huntingQueries, asimParsers, workbooks]);

  // Cancel polling on unmount
  React.useEffect(() => {
    return () => { abortRef.current = true; };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Export
            {packagerOnline === true && (
              <Badge variant="default" className="text-[10px] px-2 py-0.5">Packager Online</Badge>
            )}
            {packagerOnline === false && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5">Packager Offline</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {packagerOnline
              ? "Build a deployable ARM template directly, or download the raw solution files."
              : "Download your solution files for manual packaging with the Azure-Sentinel packaging tool."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Build Deployable Template — primary when packager is online */}
          <div>
            <Button
              onClick={handleBuildTemplate}
              disabled={
                packagerOnline === false ||
                packagingStatus === "submitting" ||
                packagingStatus === "queued" ||
                packagingStatus === "running"
              }
              variant={packagerOnline ? "default" : "secondary"}
              className="w-full justify-start"
              size="lg"
            >
              {(packagingStatus === "submitting" || packagingStatus === "queued" || packagingStatus === "running") ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : packagingStatus === "completed" ? (
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
              ) : packagingStatus === "failed" ? (
                <XCircle className="w-5 h-5 mr-2 text-destructive" />
              ) : (
                <Hammer className="w-5 h-5 mr-2" />
              )}
              {packagingStatus === "submitting" && "Submitting..."}
              {packagingStatus === "queued" && "Queued..."}
              {packagingStatus === "running" && "Building template..."}
              {packagingStatus === "completed" && "Build Deployable Template"}
              {packagingStatus === "failed" && "Build Deployable Template (retry)"}
              {(packagingStatus === "idle" || packagingStatus === "unavailable") && "Build Deployable Template"}
            </Button>
            {packagingStatus === "completed" && (
              <p className="text-xs text-green-600 mt-1">
                Template built successfully and downloaded.
              </p>
            )}
            {(packagingStatus === "failed" || packagingStatus === "unavailable") && packagingError && (
              <p className="text-xs text-destructive mt-1 whitespace-pre-wrap">
                {packagingError}
              </p>
            )}
            {packagerOnline === false && (
              <p className="text-xs text-muted-foreground mt-1">
                The packager sidecar is not running. Use the raw solution
                package download below and run{" "}
                <code>createSolutionV3.ps1</code> manually.
              </p>
            )}
            {packagerOnline && (
              <p className="text-xs text-muted-foreground mt-1">
                Runs <code>createSolutionV3.ps1</code> in a sidecar container
                and produces a ready-to-deploy solution ZIP with{" "}
                <code>mainTemplate.json</code>.
              </p>
            )}
          </div>

          {/* Raw solution package — secondary when packager is online */}
          <div className="border-t pt-3">
            <Button
              onClick={() =>
                downloadSolutionZip({
                  solution: config.solution,
                  connectors,
                  activeConnectorIndex,
                  analyticRules,
                  huntingQueries,
                  asimParsers,
                  workbooks,
                })
              }
              variant={packagerOnline ? "secondary" : "default"}
              className="w-full justify-start"
              size="lg"
            >
              <FolderArchive className="w-5 h-5 mr-2" />
              Download Solution Package (ZIP)
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Raw folder structure for the Azure-Sentinel{" "}
              <code>createSolutionV3.ps1</code> packaging tool.
              {packagerOnline === false && " This is the recommended option when the packager is offline."}
            </p>
          </div>

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

      <NextStepsCard usedPackager={packagingStatus === "completed"} />
    </div>
  );
}

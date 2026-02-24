import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { InstructionStepEditor } from "@/components/instruction-editor/InstructionStepEditor"
import { KqlEditor } from "@/components/kql-editor/KqlEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HelpCircle, Plus, Trash2 } from "lucide-react"
import type { InstructionStep } from "@/lib/schemas";
import {
  generateDefaultGraphQueries,
  generateDefaultSampleQueries,
  generateDefaultConnectivityCriteria,
  generateDefaultPermissions,
  generateDefaultInstructionSteps,
} from "@/lib/defaults";

export function StepConnectorUI() {
  const { config, updateConnectorUI } = useConnectorConfig();
  const { connectorUI } = config;
  const [customizePermissions, setCustomizePermissions] = React.useState(false);

  const handleAutoGenerate = () => {
    const { meta, schema, dataFlow, pollerConfig } = config;
    const pollerAuthType = pollerConfig?.auth.type ?? "Basic";
    updateConnectorUI({
      graphQueries: generateDefaultGraphQueries(schema.tableName),
      sampleQueries: generateDefaultSampleQueries(
        schema.tableName,
        schema.columns,
      ),
      connectivityCriteria: generateDefaultConnectivityCriteria(
        schema.tableName,
        meta.connectorKind,
      ),
      isConnectivityCriteriasMatchSome: false,
      permissions: generateDefaultPermissions(),
      instructionSteps: generateDefaultInstructionSteps(
        meta.connectorId,
        schema.tableName,
        dataFlow.streamName,
        meta.connectorKind,
        pollerAuthType,
      ),
    });
  };

  const needsAutoGenerate =
    connectorUI.graphQueries.length === 0 &&
    connectorUI.instructionSteps.length === 0;

  const handleInstructionStepsChange = React.useCallback(
    (instructionSteps: InstructionStep[]) =>
      updateConnectorUI({ instructionSteps }),
    [updateConnectorUI],
  );

  return (
    <div className="space-y-6">
      {needsAutoGenerate && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Auto-generate connector UI configuration based on your schema and
              settings.
            </p>
            <Button onClick={handleAutoGenerate}>Generate defaults</Button>
          </CardContent>
        </Card>
      )}

      <Accordion
        type="multiple"
        defaultValue={["queries", "permissions", "instructions"]}
      >
        <AccordionItem value="queries">
          <AccordionTrigger>Queries</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Graph Queries</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() =>
                      updateConnectorUI({
                        graphQueries: [
                          ...connectorUI.graphQueries,
                          { metricName: "", legend: "", baseQuery: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {connectorUI.graphQueries.map((gq, i) => (
                  <Card key={i} className="mb-2">
                    <CardContent className="pt-3 pb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Graph Query {i + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() =>
                            updateConnectorUI({
                              graphQueries: connectorUI.graphQueries.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Metric name"
                        value={gq.metricName}
                        onChange={(e) => {
                          const updated = [...connectorUI.graphQueries];
                          updated[i] = { ...gq, metricName: e.target.value };
                          updateConnectorUI({ graphQueries: updated });
                        }}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Legend"
                        value={gq.legend}
                        onChange={(e) => {
                          const updated = [...connectorUI.graphQueries];
                          updated[i] = { ...gq, legend: e.target.value };
                          updateConnectorUI({ graphQueries: updated });
                        }}
                        className="text-sm"
                      />
                      <KqlEditor
                        value={gq.baseQuery}
                        onChange={(val) => {
                          const updated = [...connectorUI.graphQueries];
                          updated[i] = { ...gq, baseQuery: val };
                          updateConnectorUI({ graphQueries: updated });
                        }}
                        height="60px"
                        showSnippets={false}
                        mode="full"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Sample Queries</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() =>
                      updateConnectorUI({
                        sampleQueries: [
                          ...connectorUI.sampleQueries,
                          { description: "", query: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {connectorUI.sampleQueries.map((sq, i) => (
                  <Card key={i} className="mb-2">
                    <CardContent className="pt-3 pb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Sample Query {i + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() =>
                            updateConnectorUI({
                              sampleQueries: connectorUI.sampleQueries.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Description"
                        value={sq.description}
                        onChange={(e) => {
                          const updated = [...connectorUI.sampleQueries];
                          updated[i] = { ...sq, description: e.target.value };
                          updateConnectorUI({ sampleQueries: updated });
                        }}
                        className="text-sm"
                      />
                      <KqlEditor
                        value={sq.query}
                        onChange={(val) => {
                          const updated = [...connectorUI.sampleQueries];
                          updated[i] = { ...sq, query: val };
                          updateConnectorUI({ sampleQueries: updated });
                        }}
                        height="80px"
                        showSnippets={false}
                        mode="full"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="permissions">
          <AccordionTrigger>Connectivity & Permissions</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Connectivity Criteria
                </Label>
                {connectorUI.connectivityCriteria.map((cc, i) => (
                  <Card key={i} className="mb-2">
                    <CardContent className="pt-3 pb-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={cc.type}
                          onValueChange={(v) => {
                            const updated = [...connectorUI.connectivityCriteria];
                            updated[i] = {
                              type: v,
                              value: v === "HasDataConnectors" ? [] : cc.value,
                            };
                            updateConnectorUI({ connectivityCriteria: updated });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HasDataConnectors">HasDataConnectors</SelectItem>
                            <SelectItem value="IsConnectedQuery">IsConnectedQuery</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() =>
                            updateConnectorUI({
                              connectivityCriteria: connectorUI.connectivityCriteria.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {cc.type === "HasDataConnectors" && (
                        <p className="text-xs text-muted-foreground">
                          Connected when at least one active data connector exists (recommended for CCF/API polling connectors).
                        </p>
                      )}
                      {cc.type === "IsConnectedQuery" && (
                        <KqlEditor
                          value={cc.value.join("\n")}
                          onChange={(val) => {
                            const updated = [...connectorUI.connectivityCriteria];
                            updated[i] = { ...cc, value: [val] };
                            updateConnectorUI({ connectivityCriteria: updated });
                          }}
                          height="80px"
                          showSnippets={false}
                          mode="full"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    updateConnectorUI({
                      connectivityCriteria: [
                        ...connectorUI.connectivityCriteria,
                        { type: "HasDataConnectors", value: [] },
                      ],
                    })
                  }
                >
                  <Plus className="w-3 h-3 mr-1" /> Add criterion
                </Button>
              </div>

              {connectorUI.connectivityCriteria.length > 1 && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="matchSome"
                    aria-label="Connected when any criterion matches (OR logic)"
                    checked={connectorUI.isConnectivityCriteriasMatchSome}
                    onChange={(e) =>
                      updateConnectorUI({
                        isConnectivityCriteriasMatchSome: e.target.checked,
                      })
                    }
                    className="rounded border-input"
                  />
                  <Label htmlFor="matchSome" className="cursor-pointer text-sm">
                    Connected when <strong>any</strong> criterion matches (OR logic)
                  </Label>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="customizePerms"
                  checked={customizePermissions}
                  onChange={(e) => setCustomizePermissions(e.target.checked)}
                  className="rounded border-input"
                />
                <Label
                  htmlFor="customizePerms"
                  className="cursor-pointer text-sm"
                >
                  Customize permissions
                </Label>
              </div>

              {customizePermissions ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Resource Providers
                  </Label>
                  {connectorUI.permissions.resourceProvider.map((rp, i) => (
                    <Card key={i} className="mb-2">
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <Input
                          placeholder="Provider"
                          value={rp.provider}
                          onChange={(e) => {
                            const updated = [
                              ...connectorUI.permissions.resourceProvider,
                            ];
                            updated[i] = { ...rp, provider: e.target.value };
                            updateConnectorUI({
                              permissions: {
                                ...connectorUI.permissions,
                                resourceProvider: updated,
                              },
                            });
                          }}
                          className="text-xs font-mono"
                        />
                        <Input
                          placeholder="Display text"
                          value={rp.permissionsDisplayText}
                          onChange={(e) => {
                            const updated = [
                              ...connectorUI.permissions.resourceProvider,
                            ];
                            updated[i] = {
                              ...rp,
                              permissionsDisplayText: e.target.value,
                            };
                            updateConnectorUI({
                              permissions: {
                                ...connectorUI.permissions,
                                resourceProvider: updated,
                              },
                            });
                          }}
                          className="text-xs"
                        />
                      </CardContent>
                    </Card>
                  ))}
                  <Label className="text-xs text-muted-foreground mt-4 block">
                    Custom Permissions
                  </Label>
                  {connectorUI.permissions.customs.map((cp, i) => (
                    <Card key={i} className="mb-2">
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <Input
                          placeholder="Name"
                          value={cp.name}
                          onChange={(e) => {
                            const updated = [
                              ...connectorUI.permissions.customs,
                            ];
                            updated[i] = { ...cp, name: e.target.value };
                            updateConnectorUI({
                              permissions: {
                                ...connectorUI.permissions,
                                customs: updated,
                              },
                            });
                          }}
                          className="text-xs"
                        />
                        <Input
                          placeholder="Description"
                          value={cp.description}
                          onChange={(e) => {
                            const updated = [
                              ...connectorUI.permissions.customs,
                            ];
                            updated[i] = { ...cp, description: e.target.value };
                            updateConnectorUI({
                              permissions: {
                                ...connectorUI.permissions,
                                customs: updated,
                              },
                            });
                          }}
                          className="text-xs"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                  Using default permissions (workspace read/write, shared keys,
                  Entra app, Azure RBAC). Check the box above to customize.
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="instructions">
          <AccordionTrigger>Instruction Steps</AccordionTrigger>
          <AccordionContent>
            <InstructionStepEditor
              steps={connectorUI.instructionSteps}
              onChange={handleInstructionStepsChange}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <HelpCircle className="w-4 h-4" />
          What is this step about?
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
              <p>
                This configures what users see when they open the connector in
                the Sentinel portal.
              </p>
              <p>
                <strong>Graph queries</strong> show metrics on the connector
                page (e.g., events over time).
              </p>
              <p>
                <strong>Sample queries</strong> appear in &quot;Next steps&quot;
                to help users explore the data.
              </p>
              <p>
                <strong>Instruction steps</strong> guide users through deploying
                and configuring the connector.
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { InstructionStepEditor } from "@/components/instruction-editor/InstructionStepEditor"
import { KqlEditor } from "@/components/kql-editor/KqlEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { InstructionStep } from "@/lib/schemas";
import { updateAtIndex } from "@/lib/array-utils";
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
                        onChange={(e) =>
                          updateConnectorUI({ graphQueries: updateAtIndex(connectorUI.graphQueries, i, { metricName: e.target.value }) })
                        }
                        className="text-sm"
                      />
                      <Input
                        placeholder="Legend"
                        value={gq.legend}
                        onChange={(e) =>
                          updateConnectorUI({ graphQueries: updateAtIndex(connectorUI.graphQueries, i, { legend: e.target.value }) })
                        }
                        className="text-sm"
                      />
                      <KqlEditor
                        value={gq.baseQuery}
                        onChange={(val) =>
                          updateConnectorUI({ graphQueries: updateAtIndex(connectorUI.graphQueries, i, { baseQuery: val }) })
                        }
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
                        onChange={(e) =>
                          updateConnectorUI({ sampleQueries: updateAtIndex(connectorUI.sampleQueries, i, { description: e.target.value }) })
                        }
                        className="text-sm"
                      />
                      <KqlEditor
                        value={sq.query}
                        onChange={(val) =>
                          updateConnectorUI({ sampleQueries: updateAtIndex(connectorUI.sampleQueries, i, { query: val }) })
                        }
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
                          onValueChange={(v) =>
                            updateConnectorUI({
                              connectivityCriteria: updateAtIndex(connectorUI.connectivityCriteria, i, {
                                type: v,
                                value: v === "HasDataConnectors" ? [] : cc.value,
                              }),
                            })
                          }
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
                          onChange={(val) =>
                            updateConnectorUI({
                              connectivityCriteria: updateAtIndex(connectorUI.connectivityCriteria, i, { value: [val] }),
                            })
                          }
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
                <div className="space-y-4">
                  {/* Resource Providers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground">Resource Providers</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          updateConnectorUI({
                            permissions: {
                              ...connectorUI.permissions,
                              resourceProvider: [
                                ...connectorUI.permissions.resourceProvider,
                                {
                                  provider: "Microsoft.OperationalInsights/workspaces",
                                  permissionsDisplayText: "",
                                  providerDisplayName: "Workspace",
                                  scope: "Workspace",
                                  requiredPermissions: { write: true, read: true, delete: false, action: false },
                                },
                              ],
                            },
                          })
                        }
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                    {connectorUI.permissions.resourceProvider.map((rp, i) => {
                      const updateRp = (patch: Partial<typeof rp>) => {
                        updateConnectorUI({
                          permissions: {
                            ...connectorUI.permissions,
                            resourceProvider: updateAtIndex(connectorUI.permissions.resourceProvider, i, patch),
                          },
                        });
                      };
                      return (
                        <Card key={i} className="mb-2">
                          <CardContent className="pt-3 pb-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Provider {i + 1}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() =>
                                  updateConnectorUI({
                                    permissions: {
                                      ...connectorUI.permissions,
                                      resourceProvider: connectorUI.permissions.resourceProvider.filter((_, j) => j !== i),
                                    },
                                  })
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>

                            {/* Provider + Scope row */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Provider</Label>
                                <Select value={rp.provider} onValueChange={(v) => updateRp({ provider: v })}>
                                  <SelectTrigger className="h-8 text-xs font-mono" aria-label="Provider">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Microsoft.OperationalInsights/workspaces">workspaces</SelectItem>
                                    <SelectItem value="Microsoft.OperationalInsights/solutions">solutions</SelectItem>
                                    <SelectItem value="Microsoft.OperationalInsights/workspaces/datasources">datasources</SelectItem>
                                    <SelectItem value="microsoft.aadiam/diagnosticSettings">diagnosticSettings</SelectItem>
                                    <SelectItem value="Microsoft.OperationalInsights/workspaces/sharedKeys">sharedKeys</SelectItem>
                                    <SelectItem value="Microsoft.Authorization/policyAssignments">policyAssignments</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Scope</Label>
                                <Select value={rp.scope} onValueChange={(v) => updateRp({ scope: v })}>
                                  <SelectTrigger className="h-8 text-xs" aria-label="Scope">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Workspace">Workspace</SelectItem>
                                    <SelectItem value="ResourceGroup">ResourceGroup</SelectItem>
                                    <SelectItem value="Subscription">Subscription</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Display name + Display text row */}
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Display name (e.g. Workspace)"
                                value={rp.providerDisplayName}
                                onChange={(e) => updateRp({ providerDisplayName: e.target.value })}
                                className="text-xs"
                              />
                              <Input
                                placeholder="Permissions display text"
                                value={rp.permissionsDisplayText}
                                onChange={(e) => updateRp({ permissionsDisplayText: e.target.value })}
                                className="text-xs"
                              />
                            </div>

                            {/* Required permissions */}
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Required Permissions</Label>
                              <div className="flex flex-wrap gap-4 text-xs">
                                {(["read", "write", "delete", "action"] as const).map((perm) => (
                                  <label key={perm} className="flex items-center gap-1.5 cursor-pointer capitalize">
                                    <input
                                      type="checkbox"
                                      checked={rp.requiredPermissions[perm]}
                                      onChange={(e) =>
                                        updateRp({
                                          requiredPermissions: {
                                            ...rp.requiredPermissions,
                                            [perm]: e.target.checked,
                                          },
                                        })
                                      }
                                      aria-label={perm}
                                    />
                                    {perm}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Custom Permissions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground">Custom Permissions</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          updateConnectorUI({
                            permissions: {
                              ...connectorUI.permissions,
                              customs: [
                                ...connectorUI.permissions.customs,
                                { name: "", description: "" },
                              ],
                            },
                          })
                        }
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                    {connectorUI.permissions.customs.map((cp, i) => (
                      <Card key={i} className="mb-2">
                        <CardContent className="pt-3 pb-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Custom {i + 1}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() =>
                                updateConnectorUI({
                                  permissions: {
                                    ...connectorUI.permissions,
                                    customs: connectorUI.permissions.customs.filter((_, j) => j !== i),
                                  },
                                })
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Name (e.g. Microsoft Entra application)"
                            value={cp.name}
                            onChange={(e) =>
                              updateConnectorUI({
                                permissions: {
                                  ...connectorUI.permissions,
                                  customs: updateAtIndex(connectorUI.permissions.customs, i, { name: e.target.value }),
                                },
                              })
                            }
                            className="text-xs"
                          />
                          <Input
                            placeholder="Description"
                            value={cp.description}
                            onChange={(e) =>
                              updateConnectorUI({
                                permissions: {
                                  ...connectorUI.permissions,
                                  customs: updateAtIndex(connectorUI.permissions.customs, i, { description: e.target.value }),
                                },
                              })
                            }
                            className="text-xs"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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

    </div>
  );
}

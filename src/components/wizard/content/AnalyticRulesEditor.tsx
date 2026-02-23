import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { KqlEditor } from "@/components/kql-editor/KqlEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, ClipboardPaste } from "lucide-react"
import type { AnalyticRule, EntityMapping, EntityFieldMapping } from "@/lib/schemas"
import { parseAnalyticRuleYaml } from "@/lib/yaml-import"

const MITRE_TACTICS = [
  "InitialAccess",
  "Execution",
  "Persistence",
  "PrivilegeEscalation",
  "DefenseEvasion",
  "CredentialAccess",
  "Discovery",
  "LateralMovement",
  "Collection",
  "Exfiltration",
  "CommandAndControl",
  "Impact",
  "Reconnaissance",
  "ResourceDevelopment",
]

const ENTITY_TYPES = [
  "Account",
  "AzureResource",
  "CloudApplication",
  "DNS",
  "File",
  "FileHash",
  "Host",
  "IP",
  "MailCluster",
  "MailMessage",
  "Mailbox",
  "Malware",
  "Process",
  "RegistryKey",
  "RegistryValue",
  "SecurityGroup",
  "SubmissionMail",
  "URL",
]

/** Valid identifiers per Sentinel entity type. */
const ENTITY_IDENTIFIERS: Record<string, string[]> = {
  Account: ["FullName", "Sid", "AadUserId", "AadTenantId", "PUID", "IsDomainJoined", "DisplayName", "ObjectGuid", "Name", "UPNSuffix", "NTDomain", "DnsDomain"],
  AzureResource: ["ResourceId"],
  CloudApplication: ["AppId", "Name", "InstanceName"],
  DNS: ["DomainName"],
  File: ["Directory", "Name"],
  FileHash: ["Algorithm", "Value"],
  Host: ["HostName", "AzureID", "DnsDomain", "NTDomain", "NetBiosName", "OmsAgentID", "OSFamily", "OSVersion", "FQDN"],
  IP: ["Address"],
  MailCluster: ["NetworkMessageIds", "CountByDeliveryStatus", "CountByThreatType", "CountByProtectionStatus", "Threats", "Query", "QueryTime", "MailCount", "IsVolumeAnomaly", "Source", "ClusterSourceIdentifier", "ClusterSourceType", "ClusterQueryStartTime", "ClusterQueryEndTime", "ClusterGroup"],
  MailMessage: ["Recipient", "Urls", "Threats", "Sender", "P1Sender", "P1SenderDisplayName", "P1SenderDomain", "SenderIP", "P2Sender", "P2SenderDisplayName", "P2SenderDomain", "ReceivedDate", "NetworkMessageId", "InternetMessageId", "Subject", "BodyFingerprintBin1", "BodyFingerprintBin2", "BodyFingerprintBin3", "BodyFingerprintBin4", "BodyFingerprintBin5", "AntispamDirection", "DeliveryAction", "DeliveryLocation", "Language", "ThreatDetectionMethods"],
  Mailbox: ["MailboxPrimaryAddress", "DisplayName", "Upn", "ExternalDirectoryObjectId", "RiskLevel"],
  Malware: ["Name", "Category"],
  Process: ["ProcessId", "CommandLine", "ElevationToken", "CreationTimeUtc"],
  RegistryKey: ["Hive", "Key"],
  RegistryValue: ["Name", "Value", "ValueType"],
  SecurityGroup: ["DistinguishedName", "SID", "ObjectGuid"],
  SubmissionMail: ["NetworkMessageId", "Timestamp", "Recipient", "Sender", "SenderIp", "Subject", "ReportType", "SubmissionId", "SubmissionDate", "Submitter"],
  URL: ["Url"],
}

/**
 * Extract column names from the last `| project` statement in a KQL query.
 * Handles aliases (e.g. `Alias = expr`) and plain column references.
 */
function extractProjectColumns(query: string): string[] {
  const projectRegex = /\|\s*project\s+(?!away\b|rename\b|keep\b|reorder\b)([\s\S]*?)(?=\||$)/gi
  let lastMatch: RegExpExecArray | null = null
  let match: RegExpExecArray | null
  while ((match = projectRegex.exec(query)) !== null) {
    lastMatch = match
  }
  if (!lastMatch) return []
  const body = lastMatch[1]
  return body
    .split(",")
    .map((part) => {
      const trimmed = part.trim()
      const assignMatch = trimmed.match(/^([A-Za-z_]\w*)\s*=/)
      if (assignMatch) return assignMatch[1]
      const identMatch = trimmed.match(/^([A-Za-z_]\w*)/)
      return identMatch ? identMatch[1] : ""
    })
    .filter(Boolean)
}

const SEVERITY_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  High: "destructive",
  Medium: "default",
  Low: "secondary",
  Informational: "outline",
}

export function AnalyticRulesEditor() {
  const { analyticRules, updateAnalyticRules, connectors } = useConnectorConfig()
  const [pasteDialogOpen, setPasteDialogOpen] = React.useState(false)
  const [yamlText, setYamlText] = React.useState("")
  const [parseError, setParseError] = React.useState("")

  const handleImportYaml = () => {
    setParseError("")
    try {
      const rule = parseAnalyticRuleYaml(yamlText)
      updateAnalyticRules([...analyticRules, rule])
      setYamlText("")
      setPasteDialogOpen(false)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse YAML")
    }
  }

  const handlePasteDialogClose = (open: boolean) => {
    if (!open) {
      setYamlText("")
      setParseError("")
    }
    setPasteDialogOpen(open)
  }

  const addRule = () => {
    const newRule: AnalyticRule = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      severity: "Medium",
      kind: "Scheduled",
      queryPeriod: "PT5H",
      queryFrequency: "PT5H",
      triggerOperator: "GreaterThan",
      triggerThreshold: 0,
      tactics: [],
      relevantTechniques: [],
      query: connectors
        .map((c) => c.schema.tableName)
        .filter(Boolean)
        .join("\n| union ") + "\n| where TimeGenerated > ago(5h)\n",
      entityMappings: [],
      requiredDataConnectors: connectors
        .filter((c) => c.meta.connectorId)
        .map((c) => ({
          connectorId: c.meta.connectorId,
          dataTypes: c.schema.tableName ? [c.schema.tableName] : [],
        })),
      version: "1.0.0",
      enabled: true,
    }
    updateAnalyticRules([...analyticRules, newRule])
  }

  const updateRule = (index: number, updates: Partial<AnalyticRule>) => {
    const updated = [...analyticRules]
    updated[index] = { ...updated[index], ...updates }
    updateAnalyticRules(updated)
  }

  const removeRule = (index: number) => {
    updateAnalyticRules(analyticRules.filter((_, i) => i !== index))
  }

  const toggleTactic = (ruleIndex: number, tactic: string) => {
    const rule = analyticRules[ruleIndex]
    const tactics = rule.tactics.includes(tactic)
      ? rule.tactics.filter((t) => t !== tactic)
      : [...rule.tactics, tactic]
    updateRule(ruleIndex, { tactics })
  }

  const availableConnectors = connectors
    .filter((c) => c.meta.connectorId)
    .map((c) => ({
      connectorId: c.meta.connectorId,
      dataTypes: c.schema.tableName ? [c.schema.tableName] : [],
      label: c.meta.title || c.meta.connectorId,
    }))

  const toggleConnector = (ruleIndex: number, connectorId: string) => {
    const rule = analyticRules[ruleIndex]
    const existing = rule.requiredDataConnectors.find(
      (r) => r.connectorId === connectorId,
    )
    if (existing) {
      updateRule(ruleIndex, {
        requiredDataConnectors: rule.requiredDataConnectors.filter(
          (r) => r.connectorId !== connectorId,
        ),
      })
    } else {
      const connector = availableConnectors.find(
        (c) => c.connectorId === connectorId,
      )
      if (connector) {
        updateRule(ruleIndex, {
          requiredDataConnectors: [
            ...rule.requiredDataConnectors,
            {
              connectorId: connector.connectorId,
              dataTypes: connector.dataTypes,
            },
          ],
        })
      }
    }
  }

  const addEntityMapping = (ruleIndex: number) => {
    const rule = analyticRules[ruleIndex]
    const mapping: EntityMapping = {
      entityType: "",
      fieldMappings: [{ identifier: "", columnName: "" }],
    }
    updateRule(ruleIndex, {
      entityMappings: [...rule.entityMappings, mapping],
    })
  }

  const updateEntityMapping = (
    ruleIndex: number,
    mappingIndex: number,
    updates: Partial<EntityMapping>,
  ) => {
    const rule = analyticRules[ruleIndex]
    const mappings = [...rule.entityMappings]
    mappings[mappingIndex] = { ...mappings[mappingIndex], ...updates }
    updateRule(ruleIndex, { entityMappings: mappings })
  }

  const removeEntityMapping = (ruleIndex: number, mappingIndex: number) => {
    const rule = analyticRules[ruleIndex]
    updateRule(ruleIndex, {
      entityMappings: rule.entityMappings.filter((_, i) => i !== mappingIndex),
    })
  }

  const addFieldMapping = (ruleIndex: number, mappingIndex: number) => {
    const rule = analyticRules[ruleIndex]
    const mappings = [...rule.entityMappings]
    const fm: EntityFieldMapping = { identifier: "", columnName: "" }
    mappings[mappingIndex] = {
      ...mappings[mappingIndex],
      fieldMappings: [...mappings[mappingIndex].fieldMappings, fm],
    }
    updateRule(ruleIndex, { entityMappings: mappings })
  }

  const updateFieldMapping = (
    ruleIndex: number,
    mappingIndex: number,
    fieldIndex: number,
    updates: Partial<EntityFieldMapping>,
  ) => {
    const rule = analyticRules[ruleIndex]
    const mappings = [...rule.entityMappings]
    const fields = [...mappings[mappingIndex].fieldMappings]
    fields[fieldIndex] = { ...fields[fieldIndex], ...updates }
    mappings[mappingIndex] = { ...mappings[mappingIndex], fieldMappings: fields }
    updateRule(ruleIndex, { entityMappings: mappings })
  }

  const removeFieldMapping = (
    ruleIndex: number,
    mappingIndex: number,
    fieldIndex: number,
  ) => {
    const rule = analyticRules[ruleIndex]
    const mappings = [...rule.entityMappings]
    mappings[mappingIndex] = {
      ...mappings[mappingIndex],
      fieldMappings: mappings[mappingIndex].fieldMappings.filter(
        (_, i) => i !== fieldIndex,
      ),
    }
    updateRule(ruleIndex, { entityMappings: mappings })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define analytic rules for threat detection in your solution.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPasteDialogOpen(true)}>
            <ClipboardPaste className="w-4 h-4 mr-1" /> Paste YAML
          </Button>
          <Button size="sm" onClick={addRule}>
            <Plus className="w-4 h-4 mr-1" /> Add Rule
          </Button>
        </div>
      </div>

      {analyticRules.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          No analytic rules yet. Click "Add Rule" to create one.
        </div>
      )}

      <Accordion type="multiple">
        {analyticRules.map((rule, ruleIndex) => (
          <AccordionItem key={rule.id} value={rule.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-2 text-left flex-1 mr-2">
                <span className="truncate">
                  {rule.name || `Rule ${ruleIndex + 1}`}
                </span>
                <Badge variant={SEVERITY_COLORS[rule.severity] || "default"}>
                  {rule.severity}
                </Badge>
                <Badge variant="outline">{rule.kind}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {/* Name & Description */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={rule.name}
                      onChange={(e) =>
                        updateRule(ruleIndex, { name: e.target.value })
                      }
                      placeholder="Detection rule name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={rule.description}
                      onChange={(e) =>
                        updateRule(ruleIndex, { description: e.target.value })
                      }
                      placeholder="Describe what this rule detects..."
                    />
                  </div>
                </div>

                {/* Severity & Kind */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Severity</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={rule.severity}
                      onChange={(e) =>
                        updateRule(ruleIndex, {
                          severity: e.target.value as AnalyticRule["severity"],
                        })
                      }
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Informational">Informational</option>
                    </select>
                  </div>
                  <div>
                    <Label>Kind</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={rule.kind}
                      onChange={(e) =>
                        updateRule(ruleIndex, {
                          kind: e.target.value as AnalyticRule["kind"],
                        })
                      }
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="NRT">NRT (Near Real-Time)</option>
                    </select>
                  </div>
                </div>

                {/* Conditional: Query Period & Frequency for Scheduled */}
                {rule.kind === "Scheduled" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Query Period (ISO 8601)</Label>
                      <Input
                        value={rule.queryPeriod}
                        onChange={(e) =>
                          updateRule(ruleIndex, {
                            queryPeriod: e.target.value,
                          })
                        }
                        placeholder="PT5H"
                      />
                    </div>
                    <div>
                      <Label>Query Frequency (ISO 8601)</Label>
                      <Input
                        value={rule.queryFrequency}
                        onChange={(e) =>
                          updateRule(ruleIndex, {
                            queryFrequency: e.target.value,
                          })
                        }
                        placeholder="PT5H"
                      />
                    </div>
                  </div>
                )}

                {/* Trigger */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trigger Operator</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={rule.triggerOperator}
                      onChange={(e) =>
                        updateRule(ruleIndex, {
                          triggerOperator:
                            e.target.value as AnalyticRule["triggerOperator"],
                        })
                      }
                    >
                      <option value="GreaterThan">Greater Than</option>
                      <option value="LessThan">Less Than</option>
                      <option value="Equal">Equal</option>
                      <option value="NotEqual">Not Equal</option>
                    </select>
                  </div>
                  <div>
                    <Label>Trigger Threshold</Label>
                    <Input
                      type="number"
                      value={rule.triggerThreshold}
                      onChange={(e) =>
                        updateRule(ruleIndex, {
                          triggerThreshold: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {/* KQL Query */}
                <div>
                  <Label>Query (KQL)</Label>
                  <KqlEditor
                    value={rule.query}
                    onChange={(value) =>
                      updateRule(ruleIndex, { query: value })
                    }
                    mode="full"
                    showSnippets={false}
                    height="200px"
                  />
                </div>

                {/* Tactics */}
                <div>
                  <Label>MITRE ATT&CK Tactics</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {MITRE_TACTICS.map((tactic) => (
                      <label
                        key={tactic}
                        className="flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={rule.tactics.includes(tactic)}
                          onChange={() => toggleTactic(ruleIndex, tactic)}
                          className="rounded"
                        />
                        {tactic.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Relevant Techniques */}
                <div>
                  <Label>Relevant Techniques (comma-separated)</Label>
                  <Input
                    value={rule.relevantTechniques.join(", ")}
                    onChange={(e) =>
                      updateRule(ruleIndex, {
                        relevantTechniques: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="T1078, T1098, T1110"
                  />
                </div>

                {/* Entity Mappings */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Entity Mappings</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addEntityMapping(ruleIndex)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Mapping
                    </Button>
                  </div>
                  {rule.entityMappings.map((mapping, mappingIndex) => (
                    <div
                      key={mappingIndex}
                      className="border border-border/50 rounded-lg p-3 mb-2 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Entity Type</Label>
                          <select
                            className="flex h-9 w-full rounded-xl border border-border/50 bg-card px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            value={mapping.entityType}
                            onChange={(e) =>
                              updateEntityMapping(ruleIndex, mappingIndex, {
                                entityType: e.target.value,
                              })
                            }
                          >
                            <option value="">Select entity type...</option>
                            {ENTITY_TYPES.map((et) => (
                              <option key={et} value={et}>
                                {et}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="mt-5"
                          onClick={() =>
                            removeEntityMapping(ruleIndex, mappingIndex)
                          }
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Field Mappings */}
                      <div className="pl-2">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Field Mappings</Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() =>
                              addFieldMapping(ruleIndex, mappingIndex)
                            }
                          >
                            <Plus className="w-3 h-3 mr-1" /> Field
                          </Button>
                        </div>
                        {(() => {
                          const identifierOptions = ENTITY_IDENTIFIERS[mapping.entityType] ?? []
                          const projectCols = extractProjectColumns(rule.query)
                          return mapping.fieldMappings.map((fm, fieldIndex) => {
                            const isIdentifierCustom = identifierOptions.length > 0 && !identifierOptions.includes(fm.identifier) && fm.identifier !== ""
                            return (
                          <div
                            key={fieldIndex}
                            className="flex items-center gap-2 mb-1"
                          >
                            <div className="flex-1 min-w-0">
                              {identifierOptions.length > 0 ? (
                                <select
                                  className="flex h-8 w-full rounded-xl border border-border/50 bg-card px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  value={isIdentifierCustom ? "__custom__" : fm.identifier}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    updateFieldMapping(
                                      ruleIndex,
                                      mappingIndex,
                                      fieldIndex,
                                      { identifier: val === "__custom__" ? "" : val },
                                    )
                                  }}
                                >
                                  <option value="" disabled>Select identifier...</option>
                                  {identifierOptions.map((id) => (
                                    <option key={id} value={id}>{id}</option>
                                  ))}
                                  <option value="__custom__">Custom...</option>
                                </select>
                              ) : (
                                <Input
                                  className="h-8 text-xs"
                                  value={fm.identifier}
                                  onChange={(e) =>
                                    updateFieldMapping(ruleIndex, mappingIndex, fieldIndex, { identifier: e.target.value })
                                  }
                                  placeholder="Identifier"
                                />
                              )}
                            </div>
                            {isIdentifierCustom && (
                              <div className="flex-1 min-w-0">
                                <Input
                                  className="h-8 text-xs"
                                  value={fm.identifier}
                                  onChange={(e) =>
                                    updateFieldMapping(ruleIndex, mappingIndex, fieldIndex, { identifier: e.target.value })
                                  }
                                  placeholder="Custom identifier"
                                />
                              </div>
                            )}
                            {projectCols.length > 0 && (
                              <div className="flex-1 min-w-0">
                                <select
                                  className="flex h-8 w-full rounded-xl border border-border/50 bg-card px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  value={projectCols.includes(fm.columnName) ? fm.columnName : ""}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      updateFieldMapping(
                                        ruleIndex,
                                        mappingIndex,
                                        fieldIndex,
                                        { columnName: e.target.value },
                                      )
                                    }
                                  }}
                                >
                                  <option value="">Pick from query...</option>
                                  {projectCols.map((col) => (
                                    <option key={col} value={col}>{col}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <Input
                                className="h-8 text-xs"
                                value={fm.columnName}
                                onChange={(e) =>
                                  updateFieldMapping(ruleIndex, mappingIndex, fieldIndex, { columnName: e.target.value })
                                }
                                placeholder="Column Name"
                              />
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              onClick={() =>
                                removeFieldMapping(
                                  ruleIndex,
                                  mappingIndex,
                                  fieldIndex,
                                )
                              }
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Required Data Connectors */}
                {availableConnectors.length > 0 && (
                  <div>
                    <Label>Required Data Connectors</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableConnectors.map((c) => (
                        <label
                          key={c.connectorId}
                          className="flex items-center gap-1.5 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={rule.requiredDataConnectors.some(
                              (r) => r.connectorId === c.connectorId,
                            )}
                            onChange={() =>
                              toggleConnector(ruleIndex, c.connectorId)
                            }
                            className="rounded"
                          />
                          <span>{c.label}</span>
                          {c.dataTypes.length > 0 && (
                            <span className="text-muted-foreground">
                              ({c.dataTypes.join(", ")})
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select which data connectors this rule depends on.
                    </p>
                  </div>
                )}

                {/* Version */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Version</Label>
                    <Input
                      value={rule.version}
                      onChange={(e) =>
                        updateRule(ruleIndex, { version: e.target.value })
                      }
                      placeholder="1.0.0"
                    />
                  </div>
                </div>

                {/* Delete */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRule(ruleIndex)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete Rule
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog open={pasteDialogOpen} onOpenChange={handlePasteDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Analytic Rule from YAML</DialogTitle>
            <DialogDescription>
              Paste a Sentinel analytic rule YAML definition. Fields like name, severity, query, tactics, and entity mappings will be imported automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={"id: ...\nname: My Detection Rule\nseverity: Medium\nkind: Scheduled\nquery: |\n  MyTable_CL\n  | where ..."}
              rows={12}
              value={yamlText}
              onChange={(e) => setYamlText(e.target.value)}
              className="font-mono text-sm"
            />
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePasteDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportYaml} disabled={!yamlText.trim()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

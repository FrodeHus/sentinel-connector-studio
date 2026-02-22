import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { KqlEditor } from "@/components/kql-editor/KqlEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Plus, Trash2 } from "lucide-react"
import type { AsimParser } from "@/lib/schemas"

const ASIM_SCHEMAS = [
  "AuditEvent",
  "Authentication",
  "Dhcp",
  "Dns",
  "FileEvent",
  "NetworkSession",
  "ProcessEvent",
  "RegistryEvent",
  "UserManagement",
  "WebSession",
] as const

/** Mandatory + recommended fields per ASIM schema (used to scaffold the parser query). */
const ASIM_SCHEMA_FIELDS: Record<string, string[]> = {
  AuditEvent: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventResultDetails",
    "EventSeverity",
    "EventUid",
    "Object",
    "OldValue",
    "NewValue",
    "Operation",
    "ActorUsername",
    "ActorUsernameType",
    "ActorUserId",
    "ActorUserIdType",
  ],
  Authentication: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventResultDetails",
    "EventSeverity",
    "EventUid",
    "TargetUsername",
    "TargetUsernameType",
    "TargetUserId",
    "TargetUserIdType",
    "SrcIpAddr",
    "SrcHostname",
    "TargetHostname",
    "TargetDomain",
    "LogonMethod",
  ],
  Dhcp: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "SrcIpAddr",
    "SrcHostname",
    "SrcMacAddr",
    "DhcpLeaseDuration",
  ],
  Dns: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventResultDetails",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventSeverity",
    "EventUid",
    "DnsQuery",
    "DnsQueryTypeName",
    "DnsResponseName",
    "DnsResponseCodeName",
    "SrcIpAddr",
    "SrcHostname",
    "SrcDomain",
    "SrcDomainType",
    "DstIpAddr",
    "TransactionIdHex",
  ],
  FileEvent: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventSeverity",
    "EventUid",
    "TargetFilePath",
    "TargetFilePathType",
    "TargetFileName",
    "ActorUsername",
    "ActorUsernameType",
    "ActorUserId",
    "ActorUserIdType",
    "SrcIpAddr",
  ],
  NetworkSession: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventResultDetails",
    "EventSeverity",
    "EventUid",
    "DvcAction",
    "SrcIpAddr",
    "SrcPortNumber",
    "SrcHostname",
    "SrcDomain",
    "SrcDomainType",
    "DstIpAddr",
    "DstPortNumber",
    "DstHostname",
    "DstDomain",
    "DstDomainType",
    "NetworkProtocol",
    "NetworkDirection",
    "DstBytes",
    "SrcBytes",
  ],
  ProcessEvent: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventSeverity",
    "EventUid",
    "ActorUsername",
    "ActorUsernameType",
    "ActorUserId",
    "ActorUserIdType",
    "TargetProcessName",
    "TargetProcessId",
    "TargetProcessCommandLine",
    "ActingProcessName",
    "ActingProcessId",
  ],
  RegistryEvent: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventSeverity",
    "EventUid",
    "ActorUsername",
    "ActorUsernameType",
    "ActorUserId",
    "ActorUserIdType",
    "RegistryKey",
    "RegistryValue",
    "RegistryValueType",
    "RegistryValueData",
  ],
  UserManagement: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventSeverity",
    "EventUid",
    "ActorUsername",
    "ActorUsernameType",
    "ActorUserId",
    "ActorUserIdType",
    "TargetUsername",
    "TargetUsernameType",
    "TargetUserId",
    "TargetUserIdType",
    "GroupName",
  ],
  WebSession: [
    "TimeGenerated",
    "EventCount",
    "EventStartTime",
    "EventEndTime",
    "EventType",
    "EventResult",
    "EventProduct",
    "EventVendor",
    "EventSchema",
    "EventSchemaVersion",
    "Dvc",
    "EventResultDetails",
    "EventSeverity",
    "EventUid",
    "DvcAction",
    "Url",
    "HttpRequestMethod",
    "HttpStatusCode",
    "SrcIpAddr",
    "SrcPortNumber",
    "SrcHostname",
    "DstIpAddr",
    "DstPortNumber",
    "DstHostname",
    "NetworkApplicationProtocol",
  ],
}

function deriveParserName(
  schema: string,
  publisher: string,
  connectorId: string,
): string {
  const vendor = publisher.replace(/[^a-zA-Z0-9]/g, "")
  const product = connectorId.replace(/[^a-zA-Z0-9]/g, "")
  return `ASim${schema}${vendor}${product}`
}

function generateParserQuery(
  schema: string,
  tableName: string,
): string {
  const fields = ASIM_SCHEMA_FIELDS[schema]
  if (!fields || !tableName) return tableName || ""

  const projectRenames = fields
    .filter((f) => f !== "TimeGenerated")
    .map((f) => `    ${f} = column_ifexists("${f}", "")`)
    .join(",\n")

  return `let parser = () {\n${tableName}\n| project-rename\n${projectRenames}\n| extend\n    EventCount = int(1),\n    EventProduct = "${tableName.replace(/_CL$/, "")}",\n    EventVendor = "YourVendor",\n    EventSchema = "${schema}",\n    EventSchemaVersion = "0.1.0"\n};\nparser`
}

export function AsimParsersEditor() {
  const { asimParsers, updateAsimParsers, connectors } = useConnectorConfig()

  const primaryConnector = connectors[0]
  const tableName = primaryConnector?.schema.tableName || ""
  const publisher = primaryConnector?.meta.publisher || ""
  const connectorId = primaryConnector?.meta.connectorId || ""

  const addParser = () => {
    const newParser: AsimParser = {
      id: crypto.randomUUID(),
      name: "",
      targetSchema: "",
      query: "",
      version: "1.0.0",
    }
    updateAsimParsers([...asimParsers, newParser])
  }

  const updateParser = (index: number, updates: Partial<AsimParser>) => {
    const updated = [...asimParsers]
    updated[index] = { ...updated[index], ...updates }
    updateAsimParsers(updated)
  }

  const handleSchemaChange = (index: number, schema: string) => {
    const name = schema
      ? deriveParserName(schema, publisher, connectorId)
      : ""
    const query = schema ? generateParserQuery(schema, tableName) : ""
    updateParser(index, { targetSchema: schema, name, query })
  }

  const removeParser = (index: number) => {
    updateAsimParsers(asimParsers.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define ASIM (Advanced Security Information Model) parsers for data
          normalization.
        </p>
        <Button size="sm" onClick={addParser}>
          <Plus className="w-4 h-4 mr-1" /> Add Parser
        </Button>
      </div>

      {asimParsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          No ASIM parsers yet. Click "Add Parser" to create one.
        </div>
      )}

      <Accordion type="multiple">
        {asimParsers.map((parser, parserIndex) => (
          <AccordionItem key={parser.id} value={parser.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-2 text-left flex-1 mr-2">
                <span className="truncate">
                  {parser.name || `Parser ${parserIndex + 1}`}
                </span>
                {parser.targetSchema && (
                  <Badge variant="outline">{parser.targetSchema}</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Target Schema</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-border/50 bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={parser.targetSchema}
                    onChange={(e) =>
                      handleSchemaChange(parserIndex, e.target.value)
                    }
                  >
                    <option value="">Select target schema...</option>
                    {ASIM_SCHEMAS.map((schema) => (
                      <option key={schema} value={schema}>
                        {schema}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecting a schema auto-generates the parser name and
                    scaffolds the KQL query with the standard fields.
                  </p>
                </div>

                <div>
                  <Label>
                    Name{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (follows ASim&lt;Schema&gt;&lt;Vendor&gt;&lt;Product&gt;
                      convention)
                    </span>
                  </Label>
                  <Input
                    value={parser.name}
                    onChange={(e) =>
                      updateParser(parserIndex, { name: e.target.value })
                    }
                    placeholder="ASimAuthenticationVendorProduct"
                  />
                </div>

                <div>
                  <Label>Query (KQL)</Label>
                  <KqlEditor
                    value={parser.query}
                    onChange={(value) =>
                      updateParser(parserIndex, { query: value })
                    }
                    mode="full"
                    showSnippets={false}
                    height="200px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Version</Label>
                    <Input
                      value={parser.version}
                      onChange={(e) =>
                        updateParser(parserIndex, { version: e.target.value })
                      }
                      placeholder="1.0.0"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeParser(parserIndex)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete Parser
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

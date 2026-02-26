import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { PollerConfigSchema } from "@/lib/schemas"
import type { PollerConfig } from "@/lib/schemas"
import { ApiTestDialog, type ApiTestResult } from "@/components/api-test/ApiTestDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { HelpCircle, ChevronDown, Plus, Trash2, FlaskConical } from "lucide-react"

function KeyValueEditor({
  value,
  onChange,
  label,
}: {
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
  label: string
}) {
  const entries = Object.entries(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => onChange({ ...value, "": "" })}
        >
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Key"
            value={k}
            onChange={(e) => {
              const newEntries = [...entries]
              newEntries[i] = [e.target.value, v]
              onChange(Object.fromEntries(newEntries))
            }}
            className="text-xs font-mono"
          />
          <Input
            placeholder="Value"
            value={v}
            onChange={(e) => {
              const newEntries = [...entries]
              newEntries[i] = [k, e.target.value]
              onChange(Object.fromEntries(newEntries))
            }}
            className="text-xs font-mono"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-destructive"
            onClick={() => {
              const newEntries = entries.filter((_, j) => j !== i)
              onChange(Object.fromEntries(newEntries))
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function StepApiConfig() {
  const { config, updatePollerConfig, updateDataFlow } = useConnectorConfig()
  const pc = config.pollerConfig ?? PollerConfigSchema.parse({})
  const [showAdvancedRequest, setShowAdvancedRequest] = React.useState(false)
  const [showAdvancedResponse, setShowAdvancedResponse] = React.useState(false)
  const [testDialogOpen, setTestDialogOpen] = React.useState(false)

  const update = (updater: (prev: PollerConfig) => PollerConfig) => {
    updatePollerConfig(updater)
  }

  const handleApplyTestResults = React.useCallback(
    (result: ApiTestResult) => {
      updatePollerConfig((prev) => ({
        ...prev,
        response: {
          ...prev.response,
          eventsJsonPaths: result.eventsJsonPaths,
          format: result.format,
        },
      }))
      if (result.inputColumns.length > 0) {
        updateDataFlow({
          inputColumnsOverride: true,
          inputColumns: result.inputColumns,
        })
      }
    },
    [updatePollerConfig, updateDataFlow],
  )

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>API Configuration</CardTitle>
            <Button size="sm" onClick={() => setTestDialogOpen(true)}>
              <FlaskConical className="w-4 h-4 mr-1" /> Test API
            </Button>
          </div>
          <CardDescription>
            Configure how Sentinel polls the REST API to ingest data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["auth", "request"]}>
            {/* Authentication */}
            <AccordionItem value="auth">
              <AccordionTrigger>Authentication</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Auth Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Basic", "APIKey", "OAuth2"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            update((prev) => ({
                              ...prev,
                              auth: { ...prev.auth, type },
                            }))
                          }
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                            pc.auth.type === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          }`}
                        >
                          {type === "APIKey" ? "API Key" : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {pc.auth.type === "Basic" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Username</Label>
                        <Input
                          value={pc.auth.userName}
                          onChange={(e) =>
                            update((prev) => ({
                              ...prev,
                              auth: { ...prev.auth, userName: e.target.value },
                            }))
                          }
                          placeholder="{{username}}"
                          className="text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Password</Label>
                        <Input
                          value={pc.auth.password}
                          onChange={(e) =>
                            update((prev) => ({
                              ...prev,
                              auth: { ...prev.auth, password: e.target.value },
                            }))
                          }
                          placeholder="{{password}}"
                          className="text-sm font-mono"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use {"{{parameterName}}"} syntax for values supplied at
                        connector deployment time.
                      </p>
                    </div>
                  )}

                  {pc.auth.type === "APIKey" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">API Key</Label>
                        <Input
                          value={pc.auth.apiKey}
                          onChange={(e) =>
                            update((prev) => ({
                              ...prev,
                              auth: { ...prev.auth, apiKey: e.target.value },
                            }))
                          }
                          placeholder="{{apiKey}}"
                          className="text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">API Key Name</Label>
                        <Input
                          value={pc.auth.apiKeyName}
                          onChange={(e) =>
                            update((prev) => ({
                              ...prev,
                              auth: {
                                ...prev.auth,
                                apiKeyName: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g., Authorization"
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Header or parameter name for the API key.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">API Key Identifier</Label>
                        <Input
                          value={pc.auth.apiKeyIdentifier}
                          onChange={(e) =>
                            update((prev) => ({
                              ...prev,
                              auth: {
                                ...prev.auth,
                                apiKeyIdentifier: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g., Bearer"
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional prefix prepended to the key value.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="apiKeyInPost"
                          checked={pc.auth.isApiKeyInPostPayload}
                          onChange={(e) =>
                            update((prev) => ({
                              ...prev,
                              auth: {
                                ...prev.auth,
                                isApiKeyInPostPayload: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="apiKeyInPost"
                          className="text-xs cursor-pointer"
                        >
                          Send API key in POST payload
                        </Label>
                      </div>
                    </div>
                  )}

                  {pc.auth.type === "OAuth2" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Client ID</Label>
                          <Input
                            value={pc.auth.clientId}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                auth: {
                                  ...prev.auth,
                                  clientId: e.target.value,
                                },
                              }))
                            }
                            placeholder="{{clientId}}"
                            className="text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Client Secret</Label>
                          <Input
                            value={pc.auth.clientSecret}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                auth: {
                                  ...prev.auth,
                                  clientSecret: e.target.value,
                                },
                              }))
                            }
                            placeholder="{{clientSecret}}"
                            className="text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Grant Type</Label>
                          <select
                            value={pc.auth.grantType}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                auth: {
                                  ...prev.auth,
                                  grantType: e.target.value as
                                    | "client_credentials"
                                    | "authorization_code",
                                },
                              }))
                            }
                            className={selectClass}
                          >
                            <option value="client_credentials">
                              Client Credentials
                            </option>
                            <option value="authorization_code">
                              Authorization Code
                            </option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Scope</Label>
                          <Input
                            value={pc.auth.scope}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                auth: {
                                  ...prev.auth,
                                  scope: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g., .default"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Token Endpoint URL *</Label>
                        <Input
                          value={pc.auth.tokenEndpointUrl}
                          onChange={(e) =>
                            update((prev) => ({
                              ...prev,
                              auth: {
                                ...prev.auth,
                                tokenEndpointUrl: e.target.value,
                              },
                            }))
                          }
                          placeholder="https://login.example.com/oauth/token"
                          className="text-sm"
                        />
                      </div>
                      {pc.auth.grantType === "authorization_code" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Authorization Endpoint
                            </Label>
                            <Input
                              value={pc.auth.authorizationEndpoint}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  auth: {
                                    ...prev.auth,
                                    authorizationEndpoint: e.target.value,
                                  },
                                }))
                              }
                              placeholder="https://login.example.com/oauth/authorize"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Redirect URI</Label>
                            <Input
                              value={pc.auth.redirectUri}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  auth: {
                                    ...prev.auth,
                                    redirectUri: e.target.value,
                                  },
                                }))
                              }
                              placeholder="https://portal.azure.com/..."
                              className="text-sm"
                            />
                          </div>
                        </>
                      )}
                      <KeyValueEditor
                        label="Token Endpoint Headers"
                        value={pc.auth.tokenEndpointHeaders ?? {}}
                        onChange={(v) =>
                          update((prev) => ({
                            ...prev,
                            auth: {
                              ...prev.auth,
                              tokenEndpointHeaders: v,
                            },
                          }))
                        }
                      />
                      <KeyValueEditor
                        label="Token Endpoint Query Parameters"
                        value={pc.auth.tokenEndpointQueryParameters ?? {}}
                        onChange={(v) =>
                          update((prev) => ({
                            ...prev,
                            auth: {
                              ...prev.auth,
                              tokenEndpointQueryParameters: v,
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Request */}
            <AccordionItem value="request">
              <AccordionTrigger>Request</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">API Endpoint *</Label>
                    <Input
                      value={pc.request.apiEndpoint}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          request: {
                            ...prev.request,
                            apiEndpoint: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://api.example.com/v1/events"
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">HTTP Method</Label>
                      <select
                        value={pc.request.httpMethod}
                        onChange={(e) =>
                          update((prev) => ({
                            ...prev,
                            request: {
                              ...prev.request,
                              httpMethod: e.target.value as "GET" | "POST",
                            },
                          }))
                        }
                        className={selectClass}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Query Window (min)</Label>
                      <Input
                        type="number"
                        value={pc.request.queryWindowInMin}
                        onChange={(e) =>
                          update((prev) => ({
                            ...prev,
                            request: {
                              ...prev.request,
                              queryWindowInMin: Number(e.target.value),
                            },
                          }))
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Start Time Attribute</Label>
                      <Input
                        value={pc.request.startTimeAttributeName}
                        onChange={(e) =>
                          update((prev) => ({
                            ...prev,
                            request: {
                              ...prev.request,
                              startTimeAttributeName: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g., startTime"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Time Attribute</Label>
                      <Input
                        value={pc.request.endTimeAttributeName}
                        onChange={(e) =>
                          update((prev) => ({
                            ...prev,
                            request: {
                              ...prev.request,
                              endTimeAttributeName: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g., endTime"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Query Time Format</Label>
                    <Input
                      value={pc.request.queryTimeFormat}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          request: {
                            ...prev.request,
                            queryTimeFormat: e.target.value,
                          },
                        }))
                      }
                      placeholder="yyyy-MM-ddTHH:mm:ssZ"
                      className="text-sm font-mono"
                    />
                  </div>

                  <Collapsible
                    open={showAdvancedRequest}
                    onOpenChange={setShowAdvancedRequest}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showAdvancedRequest ? "rotate-180" : ""}`}
                      />
                      Advanced settings
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Rate Limit (QPS)</Label>
                            <Input
                              type="number"
                              value={pc.request.rateLimitQPS}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  request: {
                                    ...prev.request,
                                    rateLimitQPS: Number(e.target.value),
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Retry Count</Label>
                            <Input
                              type="number"
                              value={pc.request.retryCount}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  request: {
                                    ...prev.request,
                                    retryCount: Number(e.target.value),
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Timeout (s)</Label>
                            <Input
                              type="number"
                              value={pc.request.timeoutInSeconds}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  request: {
                                    ...prev.request,
                                    timeoutInSeconds: Number(e.target.value),
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                        {pc.request.httpMethod === "POST" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isPostJson"
                              checked={pc.request.isPostPayloadJson}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  request: {
                                    ...prev.request,
                                    isPostPayloadJson: e.target.checked,
                                  },
                                }))
                              }
                              className="rounded border-input"
                            />
                            <Label
                              htmlFor="isPostJson"
                              className="text-xs cursor-pointer"
                            >
                              POST payload is JSON
                            </Label>
                          </div>
                        )}
                        <KeyValueEditor
                          label="Headers"
                          value={pc.request.headers ?? {}}
                          onChange={(v) =>
                            update((prev) => ({
                              ...prev,
                              request: { ...prev.request, headers: v },
                            }))
                          }
                        />
                        <KeyValueEditor
                          label="Query Parameters"
                          value={pc.request.queryParameters ?? {}}
                          onChange={(v) =>
                            update((prev) => ({
                              ...prev,
                              request: {
                                ...prev.request,
                                queryParameters: v,
                              },
                            }))
                          }
                        />
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Query Parameters Template
                          </Label>
                          <Input
                            value={pc.request.queryParametersTemplate}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                request: {
                                  ...prev.request,
                                  queryParametersTemplate: e.target.value,
                                },
                              }))
                            }
                            placeholder="Optional template string"
                            className="text-sm font-mono"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Response */}
            <AccordionItem value="response">
              <AccordionTrigger>Response</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Events JSON Paths *</Label>
                    <Input
                      value={pc.response.eventsJsonPaths.join(", ")}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          response: {
                            ...prev.response,
                            eventsJsonPaths: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                      placeholder="$"
                      className="text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated JSON paths to extract events from the
                      response. Use "$" for the root.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Response Format</Label>
                    <select
                      value={pc.response.format}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          response: {
                            ...prev.response,
                            format: e.target.value as "json" | "csv" | "xml",
                          },
                        }))
                      }
                      className={selectClass}
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="xml">XML</option>
                    </select>
                  </div>

                  <Collapsible
                    open={showAdvancedResponse}
                    onOpenChange={setShowAdvancedResponse}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showAdvancedResponse ? "rotate-180" : ""}`}
                      />
                      Advanced settings
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Success Status JSON Path
                            </Label>
                            <Input
                              value={pc.response.successStatusJsonPath}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  response: {
                                    ...prev.response,
                                    successStatusJsonPath: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., $.status"
                              className="text-sm font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Success Status Value
                            </Label>
                            <Input
                              value={pc.response.successStatusValue}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  response: {
                                    ...prev.response,
                                    successStatusValue: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., OK"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isGzip"
                              checked={pc.response.isGzipCompressed}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  response: {
                                    ...prev.response,
                                    isGzipCompressed: e.target.checked,
                                  },
                                }))
                              }
                              className="rounded border-input"
                            />
                            <Label
                              htmlFor="isGzip"
                              className="text-xs cursor-pointer"
                            >
                              Response is gzip compressed
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="convertChild"
                              checked={pc.response.convertChildPropertiesToArray}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  response: {
                                    ...prev.response,
                                    convertChildPropertiesToArray:
                                      e.target.checked,
                                  },
                                }))
                              }
                              className="rounded border-input"
                            />
                            <Label
                              htmlFor="convertChild"
                              className="text-xs cursor-pointer"
                            >
                              Convert child properties to array
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Paging */}
            <AccordionItem value="paging">
              <AccordionTrigger>Paging</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Paging Type</Label>
                    <select
                      value={pc.paging.pagingType}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          paging: {
                            ...prev.paging,
                            pagingType: e.target.value as PollerConfig["paging"]["pagingType"],
                          },
                        }))
                      }
                      className={selectClass}
                    >
                      <option value="None">None</option>
                      <option value="LinkHeader">Link Header</option>
                      <option value="NextPageUrl">Next Page URL</option>
                      <option value="NextPageToken">Next Page Token</option>
                      <option value="Offset">Offset</option>
                      <option value="PersistentToken">Persistent Token</option>
                      <option value="PersistentLink">Persistent Link</option>
                    </select>
                  </div>

                  {pc.paging.pagingType !== "None" && (
                    <div className="space-y-3">
                      {(pc.paging.pagingType === "NextPageUrl" ||
                        pc.paging.pagingType === "NextPageToken") && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Next Page Parameter Name
                          </Label>
                          <Input
                            value={pc.paging.nextPageParaName}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                paging: {
                                  ...prev.paging,
                                  nextPageParaName: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g., next_page"
                            className="text-sm"
                          />
                        </div>
                      )}

                      {pc.paging.pagingType === "NextPageToken" && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Next Page Token JSON Path
                          </Label>
                          <Input
                            value={pc.paging.nextPageTokenJsonPath}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                paging: {
                                  ...prev.paging,
                                  nextPageTokenJsonPath: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g., $.nextPageToken"
                            className="text-sm font-mono"
                          />
                        </div>
                      )}

                      {pc.paging.pagingType === "NextPageUrl" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Next Page URL</Label>
                          <Input
                            value={pc.paging.nextPageUrl}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                paging: {
                                  ...prev.paging,
                                  nextPageUrl: e.target.value,
                                },
                              }))
                            }
                            placeholder="JSON path or URL pattern"
                            className="text-sm font-mono"
                          />
                        </div>
                      )}

                      {(pc.paging.pagingType === "PersistentLink" ||
                        pc.paging.pagingType === "PersistentToken") && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Has Next Flag JSON Path
                          </Label>
                          <Input
                            value={pc.paging.hasNextFlagJsonPath}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                paging: {
                                  ...prev.paging,
                                  hasNextFlagJsonPath: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g., $.hasMore"
                            className="text-sm font-mono"
                          />
                        </div>
                      )}

                      {pc.paging.pagingType === "LinkHeader" && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Next Page Request Header
                          </Label>
                          <Input
                            value={pc.paging.nextPageRequestHeader}
                            onChange={(e) =>
                              update((prev) => ({
                                ...prev,
                                paging: {
                                  ...prev.paging,
                                  nextPageRequestHeader: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g., Link"
                            className="text-sm"
                          />
                        </div>
                      )}

                      {pc.paging.pagingType === "Offset" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Page Size Parameter Name
                            </Label>
                            <Input
                              value={pc.paging.pageSizeParaName}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  paging: {
                                    ...prev.paging,
                                    pageSizeParaName: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., limit"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Page Size</Label>
                            <Input
                              type="number"
                              value={pc.paging.pageSize || ""}
                              onChange={(e) =>
                                update((prev) => ({
                                  ...prev,
                                  paging: {
                                    ...prev.paging,
                                    pageSize: Number(e.target.value),
                                  },
                                }))
                              }
                              placeholder="e.g., 100"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {pc.paging.pagingType === "None" && (
                    <p className="text-xs text-muted-foreground">
                      No paging configured. Select a paging type if the API
                      returns paginated results.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
                This step configures how Microsoft Sentinel polls a REST API to
                ingest data.
              </p>
              <p>
                <strong>Authentication</strong> defines how Sentinel
                authenticates with the API (Basic, API Key, or OAuth2).
              </p>
              <p>
                <strong>Request</strong> specifies the API endpoint, HTTP method,
                polling interval, and time windowing.
              </p>
              <p>
                <strong>Response</strong> tells Sentinel how to extract events
                from the API response using JSON paths.
              </p>
              <p>
                <strong>Paging</strong> handles paginated API responses. Choose
                the paging strategy that matches your API.
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <ApiTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        onApply={handleApplyTestResults}
      />
    </div>
  )
}

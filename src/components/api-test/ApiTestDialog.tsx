import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { extractByJsonPaths } from "@/lib/json-path"
import { inferSchemaFromJson } from "@/lib/json-inferrer"
import { highlightJson } from "@/lib/highlight"
import type { Column } from "@/lib/schemas"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Play, Loader2 } from "lucide-react"

export interface ApiTestResult {
  eventsJsonPaths: string[]
  format: "json" | "csv" | "xml"
  inputColumns: Column[]
}

interface ApiTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (result: ApiTestResult) => void
}

/**
 * Renders syntax-highlighted JSON in a scrollable pane.
 * Content is sanitized via DOMPurify inside highlightJson().
 */
function JsonPreview({ json, label }: { json: string; label: string }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <Label className="mb-2 text-xs font-medium shrink-0">{label}</Label>
      <div className="flex-1 min-h-0 rounded-lg border border-border/50 bg-card/30 overflow-auto">
        <pre className="p-3 text-xs font-mono leading-relaxed">
          <code>
            {json.split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="inline-block w-8 shrink-0 text-right pr-3 select-none text-muted-foreground/50">
                  {i + 1}
                </span>
                {/* highlightJson sanitizes output with DOMPurify */}
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightJson(line) || " ",
                  }}
                />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function ApiTestDialog({
  open,
  onOpenChange,
  onApply,
}: ApiTestDialogProps) {
  const { config } = useConnectorConfig()
  const pollerConfig = config.pollerConfig

  const [credentials, setCredentials] = React.useState<
    Record<string, string>
  >({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [rawResponse, setRawResponse] = React.useState<string | null>(null)
  const [parsedResponse, setParsedResponse] = React.useState<Record<string, unknown> | unknown[] | null>(null)
  const [jsonPaths, setJsonPaths] = React.useState(
    pollerConfig?.response.eventsJsonPaths.join(", ") ?? "$",
  )

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setCredentials({})
      setLoading(false)
      setError("")
      setRawResponse(null)
      setParsedResponse(null)
      setJsonPaths(
        pollerConfig?.response.eventsJsonPaths.join(", ") ?? "$",
      )
    }
  }, [open, pollerConfig?.response.eventsJsonPaths])

  const extractedEvents = React.useMemo(() => {
    if (!parsedResponse) return null
    const paths = jsonPaths
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (paths.length === 0) return null
    try {
      return extractByJsonPaths(parsedResponse, paths)
    } catch {
      return null
    }
  }, [parsedResponse, jsonPaths])

  const inferredColumns = React.useMemo(() => {
    if (!extractedEvents || extractedEvents.length === 0) return null
    const first = extractedEvents[0]
    if (typeof first !== "object" || first === null || Array.isArray(first))
      return null
    try {
      return inferSchemaFromJson(first)
    } catch {
      return null
    }
  }, [extractedEvents])

  const handleSendRequest = async () => {
    if (!pollerConfig) return
    const { auth, request } = pollerConfig

    setLoading(true)
    setError("")
    setRawResponse(null)
    setParsedResponse(null)

    try {
      const headers: Record<string, string> = {
        ...request.headers,
      }

      // Build auth headers from credentials
      if (auth.type === "Basic") {
        const user = credentials.username ?? ""
        const pass = credentials.password ?? ""
        headers["Authorization"] = `Basic ${btoa(`${user}:${pass}`)}`
      } else if (auth.type === "APIKey") {
        const key = credentials.apiKey ?? ""
        const name = auth.apiKeyName || "Authorization"
        const identifier = auth.apiKeyIdentifier
        headers[name] = identifier ? `${identifier} ${key}` : key
      } else if (auth.type === "OAuth2") {
        // Token exchange
        const tokenUrl = auth.tokenEndpointUrl
        if (!tokenUrl) {
          setError("Token endpoint URL is not configured")
          setLoading(false)
          return
        }

        const tokenBody = new URLSearchParams({
          grant_type: auth.grantType,
          client_id: credentials.clientId ?? "",
          client_secret: credentials.clientSecret ?? "",
        })
        if (auth.scope) tokenBody.set("scope", auth.scope)

        const tokenHeaders: Record<string, string> = {
          "Content-Type": "application/x-www-form-urlencoded",
          ...auth.tokenEndpointHeaders,
        }

        const tokenRes = await fetch(tokenUrl, {
          method: "POST",
          headers: tokenHeaders,
          body: tokenBody.toString(),
        })

        if (!tokenRes.ok) {
          const text = await tokenRes.text()
          setError(
            `Token exchange failed (${tokenRes.status}): ${text.slice(0, 200)}`,
          )
          setLoading(false)
          return
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token
        if (!accessToken) {
          setError("Token response did not contain access_token")
          setLoading(false)
          return
        }
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      // Make the actual API call
      const endpoint = request.apiEndpoint
      if (!endpoint) {
        setError("API endpoint is not configured")
        setLoading(false)
        return
      }

      const fetchOptions: RequestInit = {
        method: request.httpMethod,
        headers,
      }

      const res = await fetch(endpoint, fetchOptions)
      const text = await res.text()

      if (!res.ok) {
        setError(`Request failed (${res.status}): ${text.slice(0, 300)}`)
        setRawResponse(text)
        setLoading(false)
        return
      }

      setRawResponse(text)

      try {
        const parsed = JSON.parse(text)
        setParsedResponse(parsed)
      } catch {
        // Response is not JSON — still show raw
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("CORS")) {
        setError(
          "Request blocked by CORS policy. The API server does not allow requests from the browser. " +
          "You can work around this by using a browser extension that disables CORS (e.g., \"CORS Unblock\") " +
          "or by running a local CORS proxy.",
        )
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    const paths = jsonPaths
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const format = parsedResponse ? "json" : ("json" as const)
    onApply({
      eventsJsonPaths: paths.length > 0 ? paths : ["$"],
      format,
      inputColumns: inferredColumns ?? [],
    })
    onOpenChange(false)
  }

  const handleClose = () => {
    setCredentials({})
    setError("")
    setRawResponse(null)
    setParsedResponse(null)
    onOpenChange(false)
  }

  const authType = pollerConfig?.auth.type ?? "Basic"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Test API Connection</DialogTitle>
          <DialogDescription>
            Enter your credentials to test the API endpoint. Credentials are
            not stored and will be cleared when this dialog closes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-auto">
          {/* Auth credentials */}
          <div className="space-y-3 shrink-0">
            <Label className="text-sm font-medium">
              Authentication ({authType})
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {authType === "Basic" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Username</Label>
                    <Input
                      type="text"
                      value={credentials.username ?? ""}
                      onChange={(e) =>
                        setCredentials((c) => ({
                          ...c,
                          username: e.target.value,
                        }))
                      }
                      placeholder="Enter username"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Password</Label>
                    <Input
                      type="password"
                      value={credentials.password ?? ""}
                      onChange={(e) =>
                        setCredentials((c) => ({
                          ...c,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Enter password"
                      className="text-sm"
                    />
                  </div>
                </>
              )}
              {authType === "APIKey" && (
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">
                    API Key
                    {pollerConfig?.auth.apiKeyName
                      ? ` (${pollerConfig.auth.apiKeyName})`
                      : ""}
                  </Label>
                  <Input
                    type="password"
                    value={credentials.apiKey ?? ""}
                    onChange={(e) =>
                      setCredentials((c) => ({
                        ...c,
                        apiKey: e.target.value,
                      }))
                    }
                    placeholder="Enter API key"
                    className="text-sm"
                  />
                </div>
              )}
              {authType === "OAuth2" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Client ID</Label>
                    <Input
                      type="text"
                      value={credentials.clientId ?? ""}
                      onChange={(e) =>
                        setCredentials((c) => ({
                          ...c,
                          clientId: e.target.value,
                        }))
                      }
                      placeholder="Enter client ID"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Client Secret</Label>
                    <Input
                      type="password"
                      value={credentials.clientSecret ?? ""}
                      onChange={(e) =>
                        setCredentials((c) => ({
                          ...c,
                          clientSecret: e.target.value,
                        }))
                      }
                      placeholder="Enter client secret"
                      className="text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSendRequest}
                disabled={loading || !pollerConfig?.request.apiEndpoint}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {loading ? "Sending..." : "Send Request"}
              </Button>
              <span className="text-xs text-muted-foreground font-mono truncate">
                {pollerConfig?.request.httpMethod ?? "GET"}{" "}
                {pollerConfig?.request.apiEndpoint || "(no endpoint configured)"}
              </span>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Response panes */}
          {rawResponse !== null && (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              {/* JSON paths input */}
              {parsedResponse != null && (
                <div className="space-y-1 shrink-0">
                  <Label className="text-xs">
                    Events JSON Paths (comma-separated)
                  </Label>
                  <Input
                    value={jsonPaths}
                    onChange={(e) => setJsonPaths(e.target.value)}
                    placeholder="$"
                    className="text-sm font-mono"
                  />
                  {extractedEvents && (
                    <p className="text-xs text-muted-foreground">
                      {extractedEvents.length} event
                      {extractedEvents.length !== 1 ? "s" : ""} extracted
                      {inferredColumns
                        ? ` \u00b7 ${inferredColumns.length} column${inferredColumns.length !== 1 ? "s" : ""} inferred`
                        : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Side-by-side preview panes */}
              <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">
                <JsonPreview
                  json={
                    parsedResponse
                      ? JSON.stringify(parsedResponse, null, 2)
                      : rawResponse
                  }
                  label="Raw Response"
                />
                {extractedEvents ? (
                  <JsonPreview
                    json={JSON.stringify(extractedEvents, null, 2)}
                    label="Extracted Events"
                  />
                ) : (
                  <div className="flex flex-col h-full min-h-0">
                    <Label className="mb-2 text-xs font-medium shrink-0">
                      Extracted Events
                    </Label>
                    <div className="flex-1 min-h-0 rounded-lg border border-border/50 bg-card/30 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        {parsedResponse
                          ? "Enter a valid JSON path to extract events"
                          : "Response is not valid JSON"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {extractedEvents && extractedEvents.length > 0 && (
            <Button onClick={handleApply}>Apply Results</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

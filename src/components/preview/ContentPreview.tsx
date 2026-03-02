import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { CONFIG } from "@/config"
import {
  generateAnalyticRuleYaml,
  generateAsimParserYaml,
  generateHuntingQueryYaml,
  generateWorkbookJson,
} from "@/lib/content-export"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check } from "lucide-react"
import { SafeHtmlSpan } from "@/components/ui/safe-html"

function highlightYaml(line: string): string {
  // Comment lines
  if (/^\s*#/.test(line)) {
    return `<span class="yaml-comment">${escapeHtml(line)}</span>`
  }

  // Key-value lines
  const kvMatch = line.match(/^(\s*(?:- )?)(\S.*?)(:\s*)(.+)?$/)
  if (kvMatch) {
    const [, indent, key, colon, value] = kvMatch
    let result = escapeHtml(indent)
    result += `<span class="yaml-key">${escapeHtml(key)}</span>`
    result += `<span class="yaml-punctuation">${escapeHtml(colon)}</span>`
    if (value !== undefined) {
      result += highlightYamlValue(value)
    }
    return result
  }

  // List items (bare values)
  const listMatch = line.match(/^(\s*- )(.+)$/)
  if (listMatch) {
    const [, prefix, value] = listMatch
    return `<span class="yaml-punctuation">${escapeHtml(prefix)}</span>${highlightYamlValue(value)}`
  }

  // Block scalar content (indented continuation)
  return escapeHtml(line)
}

function highlightYamlValue(value: string): string {
  const trimmed = value.trim()
  if (trimmed === "|" || trimmed === ">" || trimmed === "|-" || trimmed === ">-") {
    return `<span class="yaml-punctuation">${escapeHtml(value)}</span>`
  }
  if (/^(true|false)$/i.test(trimmed)) {
    return `<span class="yaml-bool">${escapeHtml(value)}</span>`
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return `<span class="yaml-number">${escapeHtml(value)}</span>`
  }
  return `<span class="yaml-string">${escapeHtml(value)}</span>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

interface TabItem {
  id: string
  label: string
  kind: "rule" | "parser" | "hunting" | "workbook"
}

export function ContentPreview() {
  const { analyticRules, asimParsers, huntingQueries, workbooks } = useConnectorConfig()
  const [copied, setCopied] = React.useState(false)
  const [activeTabId, setActiveTabId] = React.useState<string | null>(null)

  const tabs = React.useMemo<TabItem[]>(() => {
    const items: TabItem[] = []
    for (const rule of analyticRules) {
      items.push({
        id: rule.id,
        label: rule.name || "Untitled Rule",
        kind: "rule",
      })
    }
    for (const parser of asimParsers) {
      items.push({
        id: parser.id,
        label: parser.name || "Untitled Parser",
        kind: "parser",
      })
    }
    for (const query of huntingQueries) {
      items.push({
        id: query.id,
        label: query.name || "Untitled Hunt",
        kind: "hunting",
      })
    }
    for (const wb of workbooks) {
      items.push({
        id: wb.id,
        label: wb.name || "Untitled Workbook",
        kind: "workbook",
      })
    }
    return items
  }, [analyticRules, asimParsers, huntingQueries, workbooks])

  // Auto-select first tab or keep current if still valid
  React.useEffect(() => {
    if (tabs.length === 0) {
      setActiveTabId(null)
      return
    }
    if (!activeTabId || !tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id)
    }
  }, [tabs, activeTabId])

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const previewContent = React.useMemo(() => {
    if (!activeTab) return ""
    if (activeTab.kind === "rule") {
      const rule = analyticRules.find((r) => r.id === activeTab.id)
      return rule ? generateAnalyticRuleYaml(rule) : ""
    }
    if (activeTab.kind === "parser") {
      const parser = asimParsers.find((p) => p.id === activeTab.id)
      return parser ? generateAsimParserYaml(parser) : ""
    }
    if (activeTab.kind === "hunting") {
      const query = huntingQueries.find((h) => h.id === activeTab.id)
      return query ? generateHuntingQueryYaml(query) : ""
    }
    const wb = workbooks.find((w) => w.id === activeTab.id)
    return wb ? generateWorkbookJson(wb) : ""
  }, [activeTab, analyticRules, asimParsers, huntingQueries, workbooks])

  const isJsonPreview = activeTab?.kind === "workbook"
  const previewTitle = isJsonPreview ? "JSON Preview" : "YAML Preview"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewContent)
      setCopied(true)
      setTimeout(() => setCopied(false), CONFIG.COPY_FEEDBACK_DURATION_MS)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  if (tabs.length === 0) {
    return (
      <Card className="h-full flex flex-col border-t-2 border-t-primary/50 shadow-lg">
        <CardHeader className="pb-3 shrink-0 border-b border-border/30">
          <CardTitle className="text-base font-semibold">
            {previewTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Add an analytic rule, hunting query, ASIM parser, or workbook to see a preview.
          </p>
        </CardContent>
      </Card>
    )
  }

  const highlightedLines = previewContent.split("\n").map((line) =>
    isJsonPreview ? escapeHtml(line) : highlightYaml(line)
  )

  return (
    <Tabs value={activeTabId ?? ""} onValueChange={setActiveTabId}>
    <Card className="h-full flex flex-col border-t-2 border-t-primary/50 shadow-lg">
      <CardHeader className="pb-3 shrink-0 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {previewTitle}
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
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              title={tab.label}
              className="px-2 py-1 text-xs font-mono rounded truncate max-w-[180px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 pb-5 px-5 pt-4">
        <div className="h-full rounded-lg border border-border/50 bg-card/30 overflow-auto">
          <pre className="p-4 text-xs font-mono leading-relaxed">
            <code>
              {highlightedLines.map((html, i) => (
                <div key={i} className="flex">
                  <span className="inline-block w-8 shrink-0 text-right pr-3 select-none text-muted-foreground/50">
                    {i + 1}
                  </span>
                  <SafeHtmlSpan html={html} />
                </div>
              ))}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
    </Tabs>
  )
}

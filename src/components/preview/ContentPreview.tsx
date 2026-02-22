import * as React from "react"
import DOMPurify from "dompurify"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { CONFIG } from "@/config"
import { generateAnalyticRuleYaml, generateAsimParserYaml } from "@/lib/content-export"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"

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
  kind: "rule" | "parser"
}

export function ContentPreview() {
  const { analyticRules, asimParsers } = useConnectorConfig()
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
    return items
  }, [analyticRules, asimParsers])

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

  const yamlContent = React.useMemo(() => {
    if (!activeTab) return ""
    if (activeTab.kind === "rule") {
      const rule = analyticRules.find((r) => r.id === activeTab.id)
      return rule ? generateAnalyticRuleYaml(rule) : ""
    }
    const parser = asimParsers.find((p) => p.id === activeTab.id)
    return parser ? generateAsimParserYaml(parser) : ""
  }, [activeTab, analyticRules, asimParsers])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), CONFIG.COPY_FEEDBACK_DURATION_MS)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const handleTabClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setActiveTabId(e.currentTarget.dataset.tab ?? null)
    },
    [],
  )

  if (tabs.length === 0) {
    return (
      <Card className="h-full flex flex-col border-t-2 border-t-primary/50 shadow-lg">
        <CardHeader className="pb-3 shrink-0 border-b border-border/30">
          <CardTitle className="text-base font-semibold">
            YAML Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Add an analytic rule or ASIM parser to see a YAML preview.
          </p>
        </CardContent>
      </Card>
    )
  }

  const highlightedLines = yamlContent.split("\n").map((line) => {
    const html = highlightYaml(line)
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["span"],
      ALLOWED_ATTR: ["class"],
    })
  })

  return (
    <Card className="h-full flex flex-col border-t-2 border-t-primary/50 shadow-lg">
      <CardHeader className="pb-3 shrink-0 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            YAML Preview
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={handleTabClick}
              className={`px-2 py-1 text-xs rounded font-mono transition-colors truncate max-w-[180px] ${
                activeTabId === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              title={tab.label}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
                  <span dangerouslySetInnerHTML={{ __html: html || " " }} />
                </div>
              ))}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

import * as React from "react"
import CodeMirror from "@uiw/react-codemirror"
import { kql } from "@/lib/codemirror-kql"
import { useTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"

const KQL_SNIPPETS = [
  { label: "Pass through", value: "source" },
  { label: "Add TimeGenerated", value: "source | extend TimeGenerated = now()" },
  { label: "Rename field", value: 'source | extend TimeGenerated = todatetime(timestamp) | project-away timestamp' },
]

interface KqlEditorProps {
  value: string
  onChange: (value: string) => void
}

export function KqlEditor({ value, onChange }: KqlEditorProps) {
  const { theme } = useTheme()
  const extensions = React.useMemo(() => kql(theme), [theme])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">Snippets:</span>
        {KQL_SNIPPETS.map(snippet => (
          <Button
            key={snippet.label}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onChange(snippet.value)}
          >
            {snippet.label}
          </Button>
        ))}
      </div>

      <div className="rounded-md border overflow-hidden">
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={theme}
          extensions={extensions}
          height="120px"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        <code>source</code> refers to the incoming data stream. Use <code>extend</code> to add columns,{" "}
        <code>project</code> to select/rename, <code>where</code> to filter.
        The transform must produce columns matching the output table schema.
      </p>
    </div>
  )
}

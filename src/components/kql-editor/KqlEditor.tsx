import * as React from "react"
import CodeMirror from "@uiw/react-codemirror"
import { kql } from "@/lib/codemirror-kql"
import { useTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Maximize2 } from "lucide-react"

const KQL_SNIPPETS = [
  { label: "Pass through", value: "source" },
  { label: "Add TimeGenerated", value: "source | extend TimeGenerated = now()" },
  { label: "Rename field", value: 'source | extend TimeGenerated = todatetime(timestamp) | project-away timestamp' },
]

interface KqlEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  showSnippets?: boolean
  mode?: "dcr" | "full"
}

export function KqlEditor({ value, onChange, height = "120px", showSnippets = true, mode = "dcr" }: KqlEditorProps) {
  const { theme } = useTheme()
  const extensions = React.useMemo(() => kql(theme, mode), [theme, mode])
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      {showSnippets && (
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
      )}

      <div className="group relative rounded-md border overflow-hidden resize-y" style={{ minHeight: height, height }}>
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={theme}
          extensions={extensions}
          height="100%"
          className="h-full [&_.cm-editor]:!h-full [&_.cm-scroller]:!overflow-auto"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
          onClick={() => setDialogOpen(true)}
          aria-label="Expand editor"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {showSnippets && (
        <p className="text-xs text-muted-foreground">
          <code>source</code> refers to the incoming data stream. Use <code>extend</code> to add columns,{" "}
          <code>project</code> to select/rename, <code>where</code> to filter.
          The transform must produce columns matching the output table schema.
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>KQL Editor</DialogTitle>
          </DialogHeader>
          <div className="flex-1 rounded-md border overflow-hidden min-h-0">
            <CodeMirror
              value={value}
              onChange={onChange}
              theme={theme}
              extensions={extensions}
              height="100%"
              className="h-full [&_.cm-editor]:!h-full [&_.cm-scroller]:!overflow-auto"
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: true,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface KeyValueEditorProps {
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
  label: string
}

export function KeyValueEditor({ value, onChange, label }: KeyValueEditorProps) {
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

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PasteImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the raw text. Should throw on parse failure. */
  onImport: (text: string) => void
  title: string
  description?: string
  placeholder?: string
  importLabel?: string
  initialValue?: string
}

export function PasteImportDialog({
  open,
  onOpenChange,
  onImport,
  title,
  description,
  placeholder,
  importLabel = "Import",
  initialValue = "",
}: PasteImportDialogProps) {
  const [text, setText] = React.useState(initialValue)
  const [error, setError] = React.useState("")

  // Sync initialValue when dialog opens with a new value
  const prevInitialValue = React.useRef(initialValue)
  React.useEffect(() => {
    if (initialValue !== prevInitialValue.current) {
      setText(initialValue)
      prevInitialValue.current = initialValue
    }
  }, [initialValue])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setText("")
      setError("")
    }
    onOpenChange(nextOpen)
  }

  const handleImport = () => {
    setError("")
    try {
      onImport(text)
      setText("")
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder={placeholder}
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="font-mono text-sm"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!text.trim()}>
            {importLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

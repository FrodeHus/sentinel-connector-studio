import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTutorial } from "@/hooks/useTutorial"
import { Upload, Radio } from "lucide-react"

interface TutorialPickerDialogProps {
  isOpen: boolean
  onClose: () => void
  onResetAndStart: (kind: "Push" | "RestApiPoller") => void
}

export function TutorialPickerDialog({
  isOpen,
  onClose,
  onResetAndStart,
}: TutorialPickerDialogProps) {
  const { startTour } = useTutorial()

  const handleSelect = (tourId: "push" | "poller") => {
    onClose()
    const kind = tourId === "push" ? "Push" as const : "RestApiPoller" as const
    onResetAndStart(kind)
    // Start tour after reset + navigation settles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        startTour(tourId)
      })
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a Tutorial</DialogTitle>
          <DialogDescription>
            Follow a guided walkthrough to learn how to create a connector.
            Your current configuration will be reset.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSelect("push")}
            className="flex items-start gap-4 p-4 rounded-lg border-2 border-border text-left transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <Upload className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Push Connector</div>
              <p className="text-xs text-muted-foreground mt-1">
                Learn to build a connector where your application sends data to the Sentinel ingestion endpoint.
              </p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">~17 steps</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleSelect("poller")}
            className="flex items-start gap-4 p-4 rounded-lg border-2 border-border text-left transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="mt-0.5 rounded-lg bg-secondary/10 p-2 text-secondary">
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">REST API Poller</div>
              <p className="text-xs text-muted-foreground mt-1">
                Learn to build a connector that polls a REST API on a schedule to pull data in.
              </p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">~22 steps</p>
            </div>
          </button>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

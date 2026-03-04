import * as React from "react"
import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"
import { useTutorial } from "@/hooks/useTutorial"
import { TutorialPickerDialog } from "./TutorialPickerDialog"
import type { ConnectorKind } from "@/lib/schemas"

interface TutorialButtonProps {
  onResetAndStart: (kind: ConnectorKind) => void
}

export function TutorialButton({ onResetAndStart }: TutorialButtonProps) {
  const { isRunning } = useTutorial()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDialogOpen(true)}
        title="Interactive Tutorial"
        disabled={isRunning}
      >
        <GraduationCap className="w-4 h-4" />
      </Button>
      <TutorialPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onResetAndStart={onResetAndStart}
      />
    </>
  )
}

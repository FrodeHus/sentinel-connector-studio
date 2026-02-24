import * as React from "react"
import type { AppState } from "@/lib/schemas"
import { readProjectFile, readProjectFromUrl } from "@/lib/persistence"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogState {
  title: string
  description: string
  onConfirm: () => void
}

interface ErrorDialogState {
  title: string
  description: string
}

interface UseWizardDialogsOptions {
  initialProjectUrl?: string
  importAppState: (state: AppState) => void
  onProjectLoaded: () => void
}

interface UseWizardDialogsReturn {
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>
  setErrorDialog: React.Dispatch<React.SetStateAction<ErrorDialogState | null>>
  openUrlDialog: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  handleLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  dialogs: React.ReactNode
}

export function useWizardDialogs({
  initialProjectUrl,
  importAppState,
  onProjectLoaded,
}: UseWizardDialogsOptions): UseWizardDialogsReturn {
  const [urlDialogOpen, setUrlDialogOpen] = React.useState(false)
  const [projectUrl, setProjectUrl] = React.useState("")
  const [isLoadingUrl, setIsLoadingUrl] = React.useState(false)
  const [deepLinkUrl, setDeepLinkUrl] = React.useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null)
  const [errorDialog, setErrorDialog] = React.useState<ErrorDialogState | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Show consent dialog when a deep link ?project= param is present
  React.useEffect(() => {
    if (!initialProjectUrl) return
    try {
      const parsed = new URL(initialProjectUrl)
      if (!["http:", "https:"].includes(parsed.protocol)) return
      setDeepLinkUrl(initialProjectUrl)
    } catch {
      // Invalid URL — silently ignore
    }
  }, [initialProjectUrl])

  const clearProjectParam = React.useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("project")
    window.history.replaceState({}, "", url.toString())
  }, [])

  const handleDeepLinkConfirm = React.useCallback(() => {
    if (!deepLinkUrl) return
    setIsLoadingUrl(true)
    readProjectFromUrl(deepLinkUrl)
      .then((state) => {
        importAppState(state)
        onProjectLoaded()
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load project from URL."
        setErrorDialog({ title: "Load Failed", description: msg })
      })
      .finally(() => {
        setIsLoadingUrl(false)
        setDeepLinkUrl(null)
        clearProjectParam()
      })
  }, [deepLinkUrl, importAppState, onProjectLoaded, clearProjectParam])

  const handleDeepLinkDismiss = React.useCallback(() => {
    setDeepLinkUrl(null)
    clearProjectParam()
  }, [clearProjectParam])

  const handleLoadFromUrl = React.useCallback(async () => {
    if (!projectUrl.trim()) return
    setIsLoadingUrl(true)
    try {
      const state = await readProjectFromUrl(projectUrl.trim())
      setUrlDialogOpen(false)
      setProjectUrl("")
      setConfirmDialog({
        title: "Load Project",
        description: "This will replace your current configuration. Continue?",
        onConfirm: () => {
          importAppState(state)
          onProjectLoaded()
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load project from URL."
      setErrorDialog({ title: "Load Failed", description: errorMessage })
    } finally {
      setIsLoadingUrl(false)
    }
  }, [projectUrl, importAppState, onProjectLoaded])

  const handleLoadProject = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    try {
      const state = await readProjectFile(file)
      setConfirmDialog({
        title: "Load Project",
        description: "This will replace your current configuration. Continue?",
        onConfirm: () => {
          importAppState(state)
          onProjectLoaded()
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load project file."
      setErrorDialog({ title: "Load Failed", description: errorMessage })
    }
  }, [importAppState, onProjectLoaded])

  const dialogs = (
    <>
      {/* Load from URL Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Project from URL</DialogTitle>
            <DialogDescription>
              Enter the URL of a project JSON file to load. Only HTTP and HTTPS URLs are supported.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="url"
              placeholder="https://example.com/project.json"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoadingUrl) handleLoadFromUrl()
              }}
              disabled={isLoadingUrl}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setUrlDialogOpen(false); setProjectUrl("") }}
              disabled={isLoadingUrl}
            >
              Cancel
            </Button>
            <Button onClick={handleLoadFromUrl} disabled={isLoadingUrl || !projectUrl.trim()}>
              {isLoadingUrl ? "Loading..." : "Load Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog !== null}
        onOpenChange={(open) => { if (!open) setConfirmDialog(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                confirmDialog?.onConfirm()
                setConfirmDialog(null)
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={errorDialog !== null}
        onOpenChange={(open) => { if (!open) setErrorDialog(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{errorDialog?.title}</DialogTitle>
            <DialogDescription>{errorDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialog(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deep Link Consent Dialog */}
      <Dialog
        open={deepLinkUrl !== null}
        onOpenChange={(open) => { if (!open) handleDeepLinkDismiss() }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load External Project</DialogTitle>
            <DialogDescription>
              A link is requesting to load a project from an external URL. This will replace any
              current configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Source</p>
              <code className="text-xs bg-muted px-2 py-1.5 rounded block break-all select-all">
                {deepLinkUrl}
              </code>
            </div>
            <p className="text-sm text-muted-foreground">
              Only load projects from sources you trust.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeepLinkDismiss} disabled={isLoadingUrl}>
              Cancel
            </Button>
            <Button onClick={handleDeepLinkConfirm} disabled={isLoadingUrl}>
              {isLoadingUrl ? "Loading..." : "Load Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for project loading */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleLoadProject}
        aria-label="Load project file"
      />
    </>
  )

  return {
    setConfirmDialog,
    setErrorDialog,
    openUrlDialog: () => setUrlDialogOpen(true),
    fileInputRef,
    handleLoadProject,
    dialogs,
  }
}

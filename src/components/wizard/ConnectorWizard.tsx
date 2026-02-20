import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { useTheme } from "@/hooks/useTheme"
import { PollerConfigSchema } from "@/lib/schemas"
import type { ConnectorKind, ConnectorData } from "@/lib/schemas"
import { Stepper, type StepInfo } from "./Stepper"
import { StepBasics } from "./StepBasics"
import { StepSchema } from "./StepSchema"
import { StepDcr } from "./StepDcr"
import { StepApiConfig } from "./StepApiConfig"
import { StepConnectorUI } from "./StepConnectorUI"
import { StepExport } from "./StepExport"
import { ConnectorSidebar } from "./ConnectorSidebar"
import { ArmTemplatePreview } from "@/components/preview/ArmTemplatePreview"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw, Moon, Sun, Github, FileText, Save, Upload } from "lucide-react"
import {
  connectorIdToTableName,
  tableNameToStreamName,
} from "@/lib/naming"
import { downloadProjectFile, readProjectFile } from "@/lib/persistence"

interface StepDef {
  id: string
  label: string
  component: React.ComponentType
  isValid: (connectors: ConnectorData[], config: ReturnType<typeof useConnectorConfig>["config"]) => boolean
  showSidebar: boolean
  kinds?: ConnectorKind[]
}

const ALL_STEPS: StepDef[] = [
  {
    id: "basics",
    label: "Basics",
    component: StepBasics,
    isValid: (cs) =>
      cs.every(
        (c) =>
          !!c.meta.connectorId &&
          !!c.meta.title &&
          !!c.meta.publisher &&
          !!c.meta.descriptionMarkdown,
      ),
    showSidebar: true,
  },
  {
    id: "schema",
    label: "Schema",
    component: StepSchema,
    isValid: (cs) =>
      cs.every(
        (c) =>
          !!c.schema.tableName &&
          c.schema.tableName.endsWith("_CL") &&
          c.schema.columns.length >= 1,
      ),
    showSidebar: true,
  },
  {
    id: "dcr",
    label: "DCR",
    component: StepDcr,
    isValid: (cs) =>
      cs.every(
        (c) =>
          !!c.dataFlow.streamName &&
          c.dataFlow.streamName.startsWith("Custom-") &&
          !!c.dataFlow.transformKql,
      ),
    showSidebar: true,
  },
  {
    id: "api-config",
    label: "API Config",
    component: StepApiConfig,
    isValid: (cs) =>
      cs.every((c) => {
        if (c.meta.connectorKind !== "RestApiPoller") return true
        return (
          !!c.pollerConfig?.request.apiEndpoint &&
          (c.pollerConfig?.response.eventsJsonPaths?.length ?? 0) > 0
        )
      }),
    showSidebar: true,
    kinds: ["RestApiPoller"],
  },
  {
    id: "connector-ui",
    label: "Connector UI",
    component: StepConnectorUI,
    isValid: () => true,
    showSidebar: true,
  },
  {
    id: "export",
    label: "Export",
    component: StepExport,
    isValid: (_cs, config) =>
      !!config.solution.publisherId &&
      !!config.solution.offerId &&
      !!config.solution.support.name,
    showSidebar: false,
  },
]

export function ConnectorWizard() {
  const hookValue = useConnectorConfig()
  const {
    config, updateSchema, updateDataFlow, updatePollerConfig,
    hasSavedConfig, resumeSavedConfig, dismissSavedConfig, reset,
    connectors, activeConnectorIndex, addConnector, removeConnector, setActiveConnector,
    importAppState,
  } = hookValue
  const { theme, toggleTheme } = useTheme()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [visitedSteps, setVisitedSteps] = React.useState(new Set([0]))
  const [showPreview, setShowPreview] = React.useState(true)
  const [mobilePreview, setMobilePreview] = React.useState(false)
  const [importError, setImportError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Filter steps based on active connector's kind
  const activeKind = config.meta.connectorKind || "Push"
  const visibleSteps = React.useMemo(
    () => ALL_STEPS.filter((s) => !s.kinds || s.kinds.includes(activeKind)),
    [activeKind],
  )

  // Clamp currentStep if it exceeds visible steps after kind change
  React.useEffect(() => {
    if (currentStep >= visibleSteps.length) {
      setCurrentStep(visibleSteps.length - 1)
    }
  }, [visibleSteps.length, currentStep])

  // Auto-init pollerConfig when kind switches to RestApiPoller
  React.useEffect(() => {
    if (config.meta.connectorKind === "RestApiPoller" && !config.pollerConfig) {
      updatePollerConfig(() => PollerConfigSchema.parse({}))
    }
  }, [config.meta.connectorKind, config.pollerConfig, updatePollerConfig])

  // Auto-derive table name and stream name
  React.useEffect(() => {
    if (config.meta.connectorId && !config.schema.tableName) {
      const tableName = connectorIdToTableName(config.meta.connectorId)
      updateSchema({ tableName })
    }
  }, [config.meta.connectorId, config.schema.tableName, updateSchema])

  React.useEffect(() => {
    if (config.schema.tableName && !config.dataFlow.streamName) {
      const streamName = tableNameToStreamName(config.schema.tableName)
      updateDataFlow({ streamName })
    }
  }, [config.schema.tableName, config.dataFlow.streamName, updateDataFlow])

  // File operations handlers
  const handleSaveProject = () => {
    downloadProjectFile({
      solution: config.solution,
      connectors,
      activeConnectorIndex,
    })
  }

  const handleLoadProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-selected
    e.target.value = ""

    try {
      const state = await readProjectFile(file)
      if (!confirm("This will replace your current configuration. Continue?")) {
        return
      }
      importAppState(state)
      setCurrentStep(0)
      setVisitedSteps(new Set([0]))
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Failed to load project file."
      )
      alert(importError || "Failed to load project file.")
    }
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSaveProject()
      }
      // Ctrl+O or Cmd+O to open
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault()
        fileInputRef.current?.click()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [connectors, config, activeConnectorIndex])

  const steps: StepInfo[] = visibleSteps.map((step, i) => ({
    label: step.label,
    isValid: step.isValid(connectors, config),
    isVisited: visitedSteps.has(i),
  }))

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setVisitedSteps(prev => new Set(prev).add(nextStep))
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (index: number) => {
    setCurrentStep(index)
    setVisitedSteps(prev => new Set(prev).add(index))
  }

  const handleReset = () => {
    if (confirm("Reset all configuration and start fresh?")) {
      reset();
      setCurrentStep(0);
      setVisitedSteps(new Set([0]));
    }
  };

  const currentStepIsValid = steps[currentStep]?.isValid ?? true;
  const ActiveStepComponent = visibleSteps[currentStep]?.component
  const currentStepDef = visibleSteps[currentStep]

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Resume banner */}
      {hasSavedConfig && (
        <div className="shrink-0 bg-primary/10 border-b border-primary/30 px-6 py-3 flex items-center justify-between backdrop-blur-sm">
          <p className="text-sm font-medium">
            You have unsaved progress from a previous session.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={resumeSavedConfig}>
              Resume
            </Button>
            <Button size="sm" variant="outline" onClick={dismissSavedConfig}>
              Start Fresh
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 border-b border-border/50 glass-card">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sentinel CCF Connector Solution Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build Microsoft Sentinel Codeless Connector Framework (CCF)
              connectors
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/FrodeHus/sentinel-ccf-builder"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="File">
                  <FileText className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSaveProject}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Load Project
                  <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleLoadProject}
              aria-label="Load project file"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Connector sidebar — visible when step has showSidebar */}
          {currentStepDef?.showSidebar && (
            <ConnectorSidebar
              connectors={connectors}
              activeIndex={activeConnectorIndex}
              onSelect={setActiveConnector}
              onAdd={addConnector}
              onRemove={removeConnector}
            />
          )}

          {/* Form panel */}
          <div
            className={`${showPreview ? "w-full lg:w-3/5" : "w-full"} overflow-auto p-6 transition-all`}
          >
            <div className="max-w-3xl mx-auto">
              {ActiveStepComponent && <ActiveStepComponent />}
            </div>
          </div>

          {/* Preview panel */}
          <div
            className={`${showPreview ? "w-2/5 border-l border-border/50" : "w-0"} hidden lg:block overflow-auto p-6 bg-card/30 backdrop-blur-sm transition-all`}
          >
            {showPreview && <ArmTemplatePreview />}
          </div>
        </div>
      </div>

      {/* Mobile preview drawer */}
      {mobilePreview && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="flex-1 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobilePreview(false)}
          />
          <div className="h-[60vh] glass-card bg-card border-t border-border/50 overflow-auto p-4 rounded-t-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">ARM Template Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobilePreview(false)}
              >
                Close
              </Button>
            </div>
            <ArmTemplatePreview />
          </div>
        </div>
      )}

      {/* Mobile floating preview button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Button
          size="icon"
          className="gradient-primary rounded-full h-14 w-14 shadow-xl shadow-primary/30"
          onClick={() => setMobilePreview(true)}
        >
          <Eye className="w-6 h-6" />
        </Button>
      </div>

      {/* Footer with navigation */}
      <footer className="shrink-0 border-t border-border/50 glass-card">
        <div className="px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>

          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4 mr-1.5" />
              ) : (
                <Eye className="w-4 h-4 mr-1.5" />
              )}
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!currentStepIsValid}>
              Next <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Complete
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

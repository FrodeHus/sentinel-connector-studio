import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { useTheme } from "@/hooks/useTheme"
import { Stepper, type StepInfo } from "./Stepper"
import { StepBasics } from "./StepBasics"
import { StepSchema } from "./StepSchema"
import { StepDcr } from "./StepDcr"
import { StepConnectorUI } from "./StepConnectorUI"
import { StepExport } from "./StepExport"
import { ArmTemplatePreview } from "@/components/preview/ArmTemplatePreview"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw, Moon, Sun } from "lucide-react"
import {
  connectorIdToTableName,
  tableNameToStreamName,
} from "@/lib/naming"

export function ConnectorWizard() {
  const { config, updateSchema, updateDataFlow, hasSavedConfig, resumeSavedConfig, dismissSavedConfig, reset } = useConnectorConfig()
  const { theme, toggleTheme } = useTheme()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [visitedSteps, setVisitedSteps] = React.useState(new Set([0]))
  const [showPreview, setShowPreview] = React.useState(true)
  const [mobilePreview, setMobilePreview] = React.useState(false)

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

  const steps: StepInfo[] = [
    {
      label: "Basics",
      isValid: !!config.meta.connectorId && !!config.meta.title && !!config.meta.publisher && !!config.meta.descriptionMarkdown,
      isVisited: visitedSteps.has(0),
    },
    {
      label: "Schema",
      isValid: !!config.schema.tableName && config.schema.tableName.endsWith("_CL") && config.schema.columns.length >= 1,
      isVisited: visitedSteps.has(1),
    },
    {
      label: "DCR",
      isValid: !!config.dataFlow.streamName && config.dataFlow.streamName.startsWith("Custom-") && !!config.dataFlow.transformKql,
      isVisited: visitedSteps.has(2),
    },
    {
      label: "Connector UI",
      isValid: true, // This step is always valid (has auto-generation)
      isVisited: visitedSteps.has(3),
    },
    {
      label: "Export",
      isValid: !!config.solution.publisherId && !!config.solution.offerId && !!config.solution.support.name,
      isVisited: visitedSteps.has(4),
    },
  ]

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

  const currentStepIsValid = steps[currentStep].isValid

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Resume banner */}
      {hasSavedConfig && (
        <div className="shrink-0 bg-primary/10 border-b border-primary/30 px-6 py-3 flex items-center justify-between backdrop-blur-sm">
          <p className="text-sm font-medium">You have unsaved progress from a previous session.</p>
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
              Sentinel CCF Push Connector Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build Microsoft Sentinel Codeless Connector Framework (CCF) push connectors
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Reset all configuration and start fresh?")) {
                  reset()
                }
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
            </Button>
          </div>
        </div>
        <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Form panel */}
          <div className={`${showPreview ? "w-full lg:w-3/5" : "w-full"} overflow-auto p-6 transition-all`}>
            <div className="max-w-3xl mx-auto">
              {currentStep === 0 && <StepBasics />}
              {currentStep === 1 && <StepSchema />}
              {currentStep === 2 && <StepDcr />}
              {currentStep === 3 && <StepConnectorUI />}
              {currentStep === 4 && <StepExport />}
            </div>
          </div>

          {/* Preview panel */}
          <div className={`${showPreview ? "w-2/5 border-l border-border/50" : "w-0"} hidden lg:block overflow-auto p-6 bg-card/30 backdrop-blur-sm transition-all`}>
            {showPreview && <ArmTemplatePreview />}
          </div>
        </div>
      </div>

      {/* Mobile preview drawer */}
      {mobilePreview && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/80 backdrop-blur-sm" onClick={() => setMobilePreview(false)} />
          <div className="h-[60vh] glass-card bg-card border-t border-border/50 overflow-auto p-4 rounded-t-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">ARM Template Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setMobilePreview(false)}>
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
              {showPreview ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!currentStepIsValid}
            >
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
  )
}

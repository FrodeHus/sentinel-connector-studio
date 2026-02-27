import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { useTheme } from "@/hooks/useTheme"
import { PollerConfigSchema } from "@/lib/schemas"
import { Stepper, type StepInfo } from "./Stepper"
import { ConnectorSidebar } from "./ConnectorSidebar"
import { ArmTemplatePreview } from "@/components/preview/ArmTemplatePreview"
import { ContentPreview } from "@/components/preview/ContentPreview"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Moon,
  Sun,
  FileText,
  Save,
  Upload,
  Link,
  Plug,
  Package,
} from "lucide-react";
import {
  connectorIdToTableName,
  tableNameToStreamName,
} from "@/lib/naming"
import { downloadProjectFile } from "@/lib/persistence";
import { useWizardDialogs } from "./useWizardDialogs";
import { ALL_STEPS } from "./step-definitions";

interface ConnectorWizardProps {
  initialProjectUrl?: string;
}

type WizardMode = "connector" | "solution"

export function ConnectorWizard({ initialProjectUrl }: ConnectorWizardProps) {
  const {
    config,
    updateSchema,
    updateDataFlow,
    updatePollerConfig,
    hasSavedConfig,
    resumeSavedConfig,
    dismissSavedConfig,
    reset,
    connectors,
    activeConnectorIndex,
    addConnector,
    removeConnector,
    setActiveConnector,
    importAppState,
    analyticRules,
    huntingQueries,
    asimParsers,
    workbooks,
  } = useConnectorConfig();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = React.useState<WizardMode>("connector");
  const [currentStepByMode, setCurrentStepByMode] = React.useState<Record<WizardMode, number>>({
    connector: 0,
    solution: 0,
  });
  const [visitedStepIds, setVisitedStepIds] = React.useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = React.useState(true);
  const [mobilePreview, setMobilePreview] = React.useState(false);
  const { setConfirmDialog, openUrlDialog, fileInputRef, dialogs } = useWizardDialogs({
    initialProjectUrl,
    importAppState,
    onProjectLoaded: () => {
      setMode("connector");
      setCurrentStepByMode({ connector: 0, solution: 0 });
      setVisitedStepIds(new Set());
    },
  });

  // Filter steps based on active connector's kind and mode
  const activeKind = config.meta.connectorKind || "Push";
  const kindFilteredSteps = React.useMemo(
    () => ALL_STEPS.filter((s) => !s.kinds || s.kinds.includes(activeKind)),
    [activeKind],
  );
  const connectorSteps = React.useMemo(
    () => kindFilteredSteps.filter((s) => s.group === "Connectors"),
    [kindFilteredSteps],
  );
  const solutionSteps = React.useMemo(
    () => kindFilteredSteps.filter((s) => s.group === "Solution"),
    [kindFilteredSteps],
  );
  const visibleSteps = mode === "connector" ? connectorSteps : solutionSteps;
  const currentStep = currentStepByMode[mode];

  // Clamp currentStep if it exceeds visible steps after kind change
  React.useEffect(() => {
    if (currentStep >= visibleSteps.length) {
      setCurrentStepByMode((prev) => ({
        ...prev,
        [mode]: Math.max(0, visibleSteps.length - 1),
      }));
    }
  }, [visibleSteps.length, currentStep, mode]);

  // Ensure current step is tracked as visited by step id
  React.useEffect(() => {
    const current = visibleSteps[currentStep]
    if (!current) return
    setVisitedStepIds((prev) => {
      if (prev.has(current.id)) return prev
      const next = new Set(prev)
      next.add(current.id)
      return next
    })
  }, [visibleSteps, currentStep]);

  // Auto-init pollerConfig when kind switches to RestApiPoller
  React.useEffect(() => {
    if (config.meta.connectorKind === "RestApiPoller" && !config.pollerConfig) {
      updatePollerConfig(() => PollerConfigSchema.parse({}));
    }
  }, [config.meta.connectorKind, config.pollerConfig, updatePollerConfig]);

  // Auto-derive table name and stream name
  React.useEffect(() => {
    if (config.meta.connectorId && !config.schema.tableName) {
      const tableName = connectorIdToTableName(config.meta.connectorId);
      updateSchema({ tableName });
    }
  }, [config.meta.connectorId, config.schema.tableName, updateSchema]);

  React.useEffect(() => {
    if (config.schema.tableName && !config.dataFlow.streamName) {
      const streamName = tableNameToStreamName(config.schema.tableName);
      updateDataFlow({ streamName });
    }
  }, [config.schema.tableName, config.dataFlow.streamName, updateDataFlow]);

  const connectorTrackValid = React.useMemo(
    () => connectorSteps.every((s) => s.isValid(connectors, config)),
    [connectorSteps, connectors, config],
  );
  const solutionTrackValid = React.useMemo(
    () => solutionSteps
      .filter((s) => s.id !== "export")
      .every((s) => s.isValid(connectors, config)),
    [solutionSteps, connectors, config],
  );

  // File operations handlers
  const handleSaveProject = React.useCallback(() => {
    downloadProjectFile({
      solution: config.solution,
      connectors,
      activeConnectorIndex,
      analyticRules,
      huntingQueries,
      asimParsers,
      workbooks,
    });
  }, [config.solution, connectors, activeConnectorIndex, analyticRules, huntingQueries, asimParsers, workbooks]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveProject();
      }
      // Ctrl+O or Cmd+O to open
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveProject, fileInputRef]);

  const steps: StepInfo[] = visibleSteps.map((step) => ({
    label: step.label,
    group: step.group,
    about: step.about,
    isValid:
      step.id === "export"
        ? connectorTrackValid && solutionTrackValid
        : step.isValid(connectors, config),
    isVisited: visitedStepIds.has(step.id),
    badge: step.badge,
  }));

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStepByMode((prev) => ({ ...prev, [mode]: nextStep }));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStepByMode((prev) => ({ ...prev, [mode]: currentStep - 1 }));
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStepByMode((prev) => ({ ...prev, [mode]: index }));
  };

  const handleReset = () => {
    setConfirmDialog({
      title: "Reset Configuration",
      description: "Reset all configuration and start fresh?",
      onConfirm: () => {
        reset();
        setMode("connector");
        setCurrentStepByMode({ connector: 0, solution: 0 });
        setVisitedStepIds(new Set());
      },
    });
  };

  const currentStepIsValid = steps[currentStep]?.isValid ?? true;
  const ActiveStepComponent = visibleSteps[currentStep]?.component;
  const currentStepDef = visibleSteps[currentStep];
  const activePreview = showPreview ? (currentStepDef?.preview ?? null) : null;

  return (
    <div className="wizard-shell-bg h-screen flex flex-col">
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
              Sentinel Connector Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build Microsoft Sentinel Codeless Connector Framework (CCF)
              connectors
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/FrodeHus/sentinel-connector-studio"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
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
                <DropdownMenuItem onClick={openUrlDialog}>
                  <Link className="w-4 h-4 mr-2" />
                  Load from URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        <div className="px-6 pb-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <div className="inline-flex rounded-lg border border-border/60 bg-muted/20 p-1 self-center md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setMode("connector")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                mode === "connector"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plug className="w-3.5 h-3.5" />
              Connector
            </button>
            <button
              type="button"
              onClick={() => setMode("solution")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                mode === "solution"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Solution
            </button>
          </div>
          <div className="hidden md:flex items-center text-muted-foreground/50 shrink-0">
            <div className="h-px w-5 bg-border/70" />
            <ChevronRight className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>
        </div>
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
            className={`${activePreview ? "w-full lg:w-3/5" : "w-full"} overflow-auto p-6 transition-all`}
          >
            <div className="max-w-3xl mx-auto">
              {ActiveStepComponent && <ActiveStepComponent />}
            </div>
          </div>

          {/* Preview panel */}
          <div
            className={`${activePreview ? "w-2/5 border-l border-border/50" : "w-0"} hidden lg:block overflow-auto p-6 bg-transparent transition-all`}
          >
            {activePreview === "content" && <ContentPreview />}
            {activePreview === "arm" && <ArmTemplatePreview />}
          </div>
        </div>
      </div>

      {/* Mobile preview drawer */}
      {mobilePreview && currentStepDef?.preview && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="flex-1 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobilePreview(false)}
          />
          <div className="h-[60vh] glass-card bg-card border-t border-border/50 overflow-auto p-4 rounded-t-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                {currentStepDef.preview === "content" ? "YAML Preview" : "ARM Template Preview"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobilePreview(false)}
              >
                Close
              </Button>
            </div>
            {currentStepDef.preview === "content" ? <ContentPreview /> : <ArmTemplatePreview />}
          </div>
        </div>
      )}

      {/* Mobile floating preview button — only on steps that have a preview */}
      {currentStepDef?.preview && (
        <div className="lg:hidden fixed bottom-20 right-4 z-40">
          <Button
            size="icon"
            className="gradient-primary rounded-full h-14 w-14 shadow-xl shadow-primary/30"
            onClick={() => setMobilePreview(true)}
          >
            <Eye className="w-6 h-6" />
          </Button>
        </div>
      )}

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
            <span className="text-xs text-muted-foreground mr-2">
              {mode === "connector"
                ? `Connector ${Math.min(currentStep + 1, steps.length)}/${steps.length}`
                : `Solution ${Math.min(currentStep + 1, steps.length)}/${steps.length}`}
            </span>
            {currentStepDef?.preview && (
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
            )}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!currentStepIsValid}>
              Next <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : mode === "connector" ? (
            <Button
              onClick={() => setMode("solution")}
              disabled={!currentStepIsValid}
            >
              Continue to Solution <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Complete
            </Button>
          )}
        </div>
      </footer>

      {dialogs}
    </div>
  );
}

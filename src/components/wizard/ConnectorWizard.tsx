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
import { StepContent } from "./StepContent"
import { StepSolution } from "./StepSolution"
import { StepExport } from "./StepExport"
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
  Layers,
  Package,
} from "lucide-react";
import {
  connectorIdToTableName,
  tableNameToStreamName,
} from "@/lib/naming"
import { downloadProjectFile } from "@/lib/persistence";
import { useWizardDialogs } from "./useWizardDialogs";

interface StepDef {
  id: string
  label: string
  component: React.ComponentType
  isValid: (connectors: ConnectorData[], config: ReturnType<typeof useConnectorConfig>["config"]) => boolean
  showSidebar: boolean
  preview: "arm" | "content" | null
  scope: "connector" | "solution"
  kinds?: ConnectorKind[]
  badge?: string
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
    preview: "arm",
    scope: "connector",
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
    preview: "arm",
    scope: "connector",
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
    preview: "arm",
    scope: "connector",
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
    preview: "arm",
    scope: "connector",
    kinds: ["RestApiPoller"],
  },
  {
    id: "connector-ui",
    label: "Connector UI",
    component: StepConnectorUI,
    isValid: () => true,
    showSidebar: true,
    preview: "arm",
    scope: "connector",
  },
  {
    id: "content",
    label: "Content",
    component: StepContent,
    isValid: () => true,
    showSidebar: false,
    preview: "content",
    scope: "solution",
  },
  {
    id: "solution",
    label: "Solution",
    component: StepSolution,
    isValid: (_cs, config) =>
      !!config.solution.publisherId &&
      !!config.solution.offerId &&
      !!config.solution.support.name,
    showSidebar: false,
    preview: null,
    scope: "solution",
  },
  {
    id: "export",
    label: "Export",
    component: StepExport,
    isValid: () => true,
    showSidebar: false,
    preview: null,
    scope: "solution",
  },
]

interface ConnectorWizardProps {
  initialProjectUrl?: string;
}

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
    asimParsers,
  } = useConnectorConfig();
  const { theme, toggleTheme } = useTheme();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [visitedSteps, setVisitedSteps] = React.useState(new Set([0]));
  const [showPreview, setShowPreview] = React.useState(true);
  const [mobilePreview, setMobilePreview] = React.useState(false);
  const { setConfirmDialog, openUrlDialog, fileInputRef, dialogs } = useWizardDialogs({
    initialProjectUrl,
    importAppState,
    onProjectLoaded: () => { setCurrentStep(0); setVisitedSteps(new Set([0])); },
  });

  // Filter steps based on active connector's kind
  const activeKind = config.meta.connectorKind || "Push";
  const visibleSteps = React.useMemo(
    () => ALL_STEPS.filter((s) => !s.kinds || s.kinds.includes(activeKind)),
    [activeKind],
  );

  // Clamp currentStep if it exceeds visible steps after kind change
  React.useEffect(() => {
    if (currentStep >= visibleSteps.length) {
      setCurrentStep(visibleSteps.length - 1);
    }
  }, [visibleSteps.length, currentStep]);

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

  // File operations handlers
  const handleSaveProject = React.useCallback(() => {
    downloadProjectFile({
      solution: config.solution,
      connectors,
      activeConnectorIndex,
      analyticRules,
      asimParsers,
    });
  }, [config.solution, connectors, activeConnectorIndex, analyticRules, asimParsers]);

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

  const steps: StepInfo[] = visibleSteps.map((step, i) => ({
    label: step.label,
    isValid: step.isValid(connectors, config),
    isVisited: visitedSteps.has(i),
    badge: step.badge,
    scope: step.scope,
    groupStart: i > 0 && step.scope !== visibleSteps[i - 1].scope,
  }));

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps((prev) => new Set(prev).add(nextStep));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setVisitedSteps((prev) => new Set(prev).add(index));
  };

  const handleReset = () => {
    setConfirmDialog({
      title: "Reset Configuration",
      description: "Reset all configuration and start fresh?",
      onConfirm: () => {
        reset();
        setCurrentStep(0);
        setVisitedSteps(new Set([0]));
      },
    });
  };

  const currentStepIsValid = steps[currentStep]?.isValid ?? true;
  const ActiveStepComponent = visibleSteps[currentStep]?.component;
  const currentStepDef = visibleSteps[currentStep];
  const activePreview = showPreview ? (currentStepDef?.preview ?? null) : null;

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
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Vertical nav rail */}
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />

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
          <div className="flex-1 overflow-auto p-6 min-w-0 transition-all">
            <div className="max-w-3xl mx-auto">
              {currentStepDef && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/55 mb-5 pb-4 border-b border-border/25">
                  {currentStepDef.scope === "connector" ? (
                    <>
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      Per connector — configured individually for each connector
                    </>
                  ) : (
                    <>
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      Solution-wide — shared across all connectors
                    </>
                  )}
                </div>
              )}
              {ActiveStepComponent && <ActiveStepComponent />}
            </div>
          </div>

          {/* Preview panel */}
          <div
            className={`${activePreview ? "w-2/5 border-l border-border/50" : "w-0"} hidden lg:block overflow-auto p-6 bg-card/30 backdrop-blur-sm transition-all`}
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

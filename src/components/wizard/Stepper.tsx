import * as React from "react"
import { cn } from "@/lib/utils"
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, AlertCircle, HelpCircle } from "lucide-react"

export interface StepInfo {
  label: string
  group?: string
  isValid: boolean
  isVisited: boolean
  badge?: string
  about?: string[]
}

interface StepperProps {
  steps: StepInfo[]
  currentStep: number
  onStepClick: (index: number) => void
}

interface StepGroup {
  label: string
  steps: { step: StepInfo; globalIndex: number }[]
}

function groupSteps(steps: StepInfo[]): StepGroup[] {
  const groups: StepGroup[] = []
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const groupLabel = step.group ?? ""
    const last = groups[groups.length - 1]
    if (last && last.label === groupLabel) {
      last.steps.push({ step, globalIndex: i })
    } else {
      groups.push({ label: groupLabel, steps: [{ step, globalIndex: i }] })
    }
  }
  return groups
}

function StepButton({
  step,
  index,
  isCurrent,
  onClick,
}: {
  step: StepInfo
  index: number
  isCurrent: boolean
  onClick: () => void
}) {
  const isCompleted = step.isVisited && step.isValid
  const hasError = step.isVisited && !step.isValid

  return (
    <button
      onClick={onClick}
      aria-current={isCurrent ? "step" : undefined}
      aria-label={`${step.label}: ${isCompleted ? "completed" : hasError ? "has errors" : isCurrent ? "current step" : "not started"}`}
      className={cn(
        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border",
        isCurrent &&
          "gradient-primary text-white border-transparent shadow-lg shadow-primary/25",
        !isCurrent &&
          isCompleted &&
          "bg-card border-border/50 text-foreground hover:border-primary/50 hover:bg-card/80",
        !isCurrent &&
          hasError &&
          "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20",
        !isCurrent &&
          !step.isVisited &&
          "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-all",
          isCurrent && "bg-white/20 text-white",
          !isCurrent &&
            isCompleted &&
            "bg-primary/15 text-primary border border-primary/30",
          !isCurrent && hasError && "bg-destructive text-white",
          !isCurrent &&
            !step.isVisited &&
            "bg-muted text-muted-foreground",
        )}
      >
        {isCompleted && !isCurrent ? (
          <Check className="w-3.5 h-3.5" />
        ) : hasError && !isCurrent ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          index + 1
        )}
      </span>
      <span className="hidden sm:inline">{step.label}</span>
      {step.about && step.about.length > 0 && (
        <TooltipRoot>
          <TooltipTrigger asChild>
            <span className={cn(
              "inline-flex items-center",
              isCurrent ? "text-white/90" : "text-muted-foreground",
            )}>
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-sm whitespace-normal text-left space-y-1.5"
          >
            <p className="font-semibold text-xs">{step.label}</p>
            {step.about.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </TooltipContent>
        </TooltipRoot>
      )}
      {step.badge && (
        <span className={cn(
          "hidden sm:inline text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md leading-none border",
          isCurrent
            ? "bg-white/20 text-white border-white/30"
            : "bg-primary/15 text-primary border-primary/30",
        )}>
          {step.badge}
        </span>
      )}
    </button>
  )
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  const groups = React.useMemo(() => groupSteps(steps), [steps])

  return (
    <TooltipProvider>
      <nav className="flex items-end justify-center gap-6 md:gap-8 py-6 px-2 overflow-x-auto">
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div className="w-px self-stretch bg-border shrink-0" />
            )}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 md:gap-4">
                {group.steps.map(({ step, globalIndex }, si) => (
                  <div key={globalIndex} className="flex items-center gap-2 md:gap-4">
                    <StepButton
                      step={step}
                      index={globalIndex}
                      isCurrent={globalIndex === currentStep}
                      onClick={() => onStepClick(globalIndex)}
                    />
                    {si < group.steps.length - 1 && (
                      <div
                        className={cn(
                          "w-8 h-0.5 rounded-full transition-all",
                          step.isVisited && step.isValid
                            ? "bg-gradient-to-r from-primary to-secondary"
                            : "bg-border/30",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}
      </nav>
    </TooltipProvider>
  )
}

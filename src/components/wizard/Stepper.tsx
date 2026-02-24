import { cn } from "@/lib/utils"
import { Check, AlertCircle } from "lucide-react"

export interface StepInfo {
  label: string
  isValid: boolean
  isVisited: boolean
  badge?: string
  scope: "connector" | "solution"
  groupStart?: boolean
}

interface StepperProps {
  steps: StepInfo[]
  currentStep: number
  onStepClick: (index: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav className="flex items-center justify-center gap-2 md:gap-4 py-6 px-2 overflow-x-auto">
      {steps.map((step, index) => {
        const isCurrent = index === currentStep;
        const isCompleted = step.isVisited && step.isValid;
        const hasError = step.isVisited && !step.isValid;

        return (
          <div key={index} className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => onStepClick(index)}
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
            {index < steps.length - 1 && (
              steps[index + 1].groupStart ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-3 h-0.5 bg-border/25 rounded-full" />
                  <span className="hidden sm:inline text-[9px] uppercase tracking-widest text-muted-foreground/40 font-medium whitespace-nowrap">
                    Solution
                  </span>
                  <div className="w-3 h-0.5 bg-border/25 rounded-full" />
                </div>
              ) : (
                <div
                  className={cn(
                    "w-8 h-0.5 rounded-full transition-all",
                    isCompleted
                      ? "bg-gradient-to-r from-primary to-secondary"
                      : "bg-border/30",
                  )}
                />
              )
            )}
          </div>
        );
      })}
    </nav>
  );
}

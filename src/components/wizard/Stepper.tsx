import * as React from "react"
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
    <nav className="w-44 shrink-0 border-r border-border/50 bg-card/20 overflow-y-auto flex flex-col py-3">
      {steps.map((step, index) => {
        const isCurrent = index === currentStep
        const isCompleted = step.isVisited && step.isValid
        const hasError = step.isVisited && !step.isValid

        return (
          <React.Fragment key={index}>
            {(index === 0 || step.groupStart) && (
              <div
                className={cn(
                  "px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40",
                  index > 0 && "mt-3 pt-3 border-t border-border/30",
                )}
              >
                {step.scope === "connector" ? "Connector" : "Solution"}
              </div>
            )}
            <button
              type="button"
              onClick={() => onStepClick(index)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${step.label}: ${isCompleted ? "completed" : hasError ? "has errors" : isCurrent ? "current step" : "not started"}`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm font-medium transition-all cursor-pointer text-left",
                isCurrent && "gradient-primary text-white shadow-sm shadow-primary/20",
                !isCurrent && isCompleted && "text-foreground hover:bg-muted/50",
                !isCurrent && hasError && "text-destructive hover:bg-destructive/10",
                !isCurrent && !step.isVisited && "text-muted-foreground hover:bg-muted/30",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0",
                  isCurrent && "bg-white/20 text-white",
                  !isCurrent && isCompleted && "bg-primary/15 text-primary border border-primary/30",
                  !isCurrent && hasError && "bg-destructive text-white",
                  !isCurrent && !step.isVisited && "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3" />
                ) : hasError && !isCurrent ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="truncate">{step.label}</span>
              {step.badge && (
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase px-1 py-0.5 rounded border shrink-0 leading-none",
                    isCurrent
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  {step.badge}
                </span>
              )}
            </button>
          </React.Fragment>
        )
      })}
    </nav>
  )
}

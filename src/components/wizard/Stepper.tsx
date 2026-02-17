import { cn } from "@/lib/utils"
import { Check, AlertCircle } from "lucide-react"

export interface StepInfo {
  label: string
  isValid: boolean
  isVisited: boolean
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
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 rounded-full transition-all",
                  isCompleted
                    ? "bg-gradient-to-r from-primary to-secondary"
                    : "bg-border/30",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

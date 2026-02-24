import type { InstructionStep, Instruction } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, ArrowUp, ArrowDown, GripVertical } from "lucide-react"

interface InstructionStepEditorProps {
  steps: InstructionStep[]
  onChange: (steps: InstructionStep[]) => void
}

export function InstructionStepEditor({ steps, onChange }: InstructionStepEditorProps) {
  const addStep = () => {
    onChange([
      ...steps,
      {
        title: "",
        description: "",
        instructions: [{ type: "Markdown", parameters: { content: "" } }],
      },
    ])
  }

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, updates: Partial<InstructionStep>) => {
    onChange(steps.map((step, i) => i === index ? { ...step, ...updates } : step))
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    onChange(updated)
  }

  const addInstruction = (stepIndex: number) => {
    const step = steps[stepIndex]
    updateStep(stepIndex, {
      instructions: [
        ...step.instructions,
        { type: "Markdown" as const, parameters: { content: "" } },
      ],
    })
  }

  const removeInstruction = (stepIndex: number, instrIndex: number) => {
    const step = steps[stepIndex]
    updateStep(stepIndex, {
      instructions: step.instructions.filter((_, i) => i !== instrIndex),
    })
  }

  const updateInstruction = (stepIndex: number, instrIndex: number, instr: Instruction) => {
    const step = steps[stepIndex]
    updateStep(stepIndex, {
      instructions: step.instructions.map((inst, i) => i === instrIndex ? instr : inst),
    })
  }

  return (
    <div className="space-y-4">
      {steps.map((step, stepIndex) => (
        <Card key={stepIndex}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Step {stepIndex + 1}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveStep(stepIndex, "up")}
                  disabled={stepIndex === 0}
                  aria-label={`Move step ${stepIndex + 1} up`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveStep(stepIndex, "down")}
                  disabled={stepIndex === steps.length - 1}
                  aria-label={`Move step ${stepIndex + 1} down`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeStep(stepIndex)}
                  aria-label={`Remove step ${stepIndex + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={step.title}
                onChange={(e) =>
                  updateStep(stepIndex, { title: e.target.value })
                }
                placeholder="Step title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={step.description}
                onChange={(e) =>
                  updateStep(stepIndex, { description: e.target.value })
                }
                placeholder="Step description (supports Markdown)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Instructions
              </Label>
              {step.instructions.map((instr, instrIndex) => (
                <div
                  key={instrIndex}
                  className="flex items-start gap-2 p-2 border rounded-md bg-muted/50"
                >
                  <GripVertical className="w-4 h-4 mt-2.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={instr.type}
                        onValueChange={(v) =>
                          updateInstruction(stepIndex, instrIndex, {
                            ...instr,
                            type: v as Instruction["type"],
                          })
                        }
                      >
                        <SelectTrigger
                          className="h-8 text-xs"
                          aria-label="Instruction type"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Markdown">Markdown</SelectItem>
                          <SelectItem value="CopyableLabel">Copyable Label</SelectItem>
                          <SelectItem value="DeployPushConnectorButton">Deploy Button</SelectItem>
                          <SelectItem value="ConnectionToggleButton">Connection Toggle</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive ml-auto shrink-0"
                        onClick={() => removeInstruction(stepIndex, instrIndex)}
                        aria-label="Remove instruction"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {instr.type === "Markdown" && (
                      <Textarea
                        value={
                          (instr.parameters as Record<string, string>)
                            .content || ""
                        }
                        onChange={(e) =>
                          updateInstruction(stepIndex, instrIndex, {
                            ...instr,
                            parameters: {
                              ...instr.parameters,
                              content: e.target.value,
                            },
                          })
                        }
                        placeholder="Markdown content..."
                        rows={2}
                        className="text-xs"
                      />
                    )}
                    {instr.type === "CopyableLabel" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={
                            (instr.parameters as Record<string, string>)
                              .label || ""
                          }
                          onChange={(e) =>
                            updateInstruction(stepIndex, instrIndex, {
                              ...instr,
                              parameters: {
                                ...instr.parameters,
                                label: e.target.value,
                              },
                            })
                          }
                          placeholder="Label"
                          className="text-xs"
                        />
                        <Input
                          value={
                            (instr.parameters as Record<string, string>)
                              .value || ""
                          }
                          onChange={(e) =>
                            updateInstruction(stepIndex, instrIndex, {
                              ...instr,
                              parameters: {
                                ...instr.parameters,
                                value: e.target.value,
                              },
                            })
                          }
                          placeholder="Value (or fillWith)"
                          className="text-xs"
                        />
                      </div>
                    )}
                    {instr.type === "DeployPushConnectorButton" && (
                      <p className="text-xs text-muted-foreground italic">
                        Deploy button (no additional configuration needed)
                      </p>
                    )}
                    {instr.type === "ConnectionToggleButton" && (
                      <p className="text-xs text-muted-foreground italic">
                        Connection toggle button (enables/disables the poller)
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => addInstruction(stepIndex)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add instruction
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addStep}>
        <Plus className="w-4 h-4 mr-1" /> Add instruction step
      </Button>
    </div>
  );
}

import * as React from "react"
import type { InstructionStep, Instruction } from "@/lib/schemas"
import { updateAtIndex } from "@/lib/array-utils"
import { InstructionTypeRenderer } from "./InstructionRenderers"
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

function defaultParametersForType(type: Instruction["type"]): Record<string, unknown> {
  switch (type) {
    case "Markdown":
      return { content: "" }
    case "CopyableLabel":
      return { label: "", value: "" }
    case "Textbox":
      return { label: "", placeholder: "", type: "text", name: "" }
    case "OAuthForm":
      return {
        clientIdLabel: "Client ID",
        clientSecretLabel: "Client Secret",
        connectButtonLabel: "Connect",
        disconnectButtonLabel: "Disconnect",
      }
    case "Dropdown":
      return { label: "", name: "", placeholder: "", options: [], isMultiSelect: false, required: false }
    case "InfoMessage":
      return { text: "", visible: true, inline: true }
    case "InstructionStepsGroup":
      return { title: "", canCollapseAllSections: true, expanded: false }
    case "ConnectionToggleButton":
      return { name: "toggle", connectLabel: "Connect", disconnectLabel: "Disconnect" }
    case "InstallAgent":
      return { linkType: "InstallAgentOnWindowsVirtualMachine" }
    case "DeployPushConnectorButton":
    default:
      return {}
  }
}

export function InstructionStepEditor({ steps, onChange }: InstructionStepEditorProps) {
  const addStep = React.useCallback(() => {
    onChange([
      ...steps,
      {
        title: "",
        description: "",
        instructions: [{ type: "Markdown", parameters: { content: "" } }],
      },
    ])
  }, [steps, onChange])

  const removeStep = React.useCallback((index: number) => {
    onChange(steps.filter((_, i) => i !== index))
  }, [steps, onChange])

  const updateStep = React.useCallback((index: number, updates: Partial<InstructionStep>) => {
    onChange(updateAtIndex(steps, index, updates))
  }, [steps, onChange])

  const moveStep = React.useCallback((index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    onChange(updated)
  }, [steps, onChange])

  const addInstruction = React.useCallback((stepIndex: number) => {
    const step = steps[stepIndex]
    onChange(updateAtIndex(steps, stepIndex, {
      instructions: [
        ...step.instructions,
        { type: "Markdown" as const, parameters: { content: "" } },
      ],
    }))
  }, [steps, onChange])

  const removeInstruction = React.useCallback((stepIndex: number, instrIndex: number) => {
    const step = steps[stepIndex]
    onChange(updateAtIndex(steps, stepIndex, {
      instructions: step.instructions.filter((_, i) => i !== instrIndex),
    }))
  }, [steps, onChange])

  const updateInstruction = React.useCallback((stepIndex: number, instrIndex: number, instr: Instruction) => {
    onChange(updateAtIndex(steps, stepIndex, {
      instructions: updateAtIndex(steps[stepIndex].instructions, instrIndex, instr),
    }))
  }, [steps, onChange])

  const changeInstructionType = React.useCallback((
    stepIndex: number,
    instrIndex: number,
    newType: Instruction["type"],
  ) => {
    updateInstruction(stepIndex, instrIndex, {
      type: newType,
      parameters: defaultParametersForType(newType),
    })
  }, [updateInstruction])

  const handleParamChange = React.useCallback((
    stepIndex: number,
    instrIndex: number,
    instr: Instruction,
    key: string,
    value: unknown,
  ) => {
    updateInstruction(stepIndex, instrIndex, {
      ...instr,
      parameters: { ...instr.parameters, [key]: value },
    })
  }, [updateInstruction])

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
                onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
                placeholder="Step title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={step.description}
                onChange={(e) => updateStep(stepIndex, { description: e.target.value })}
                placeholder="Step description (supports Markdown)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Instructions</Label>
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
                          changeInstructionType(stepIndex, instrIndex, v as Instruction["type"])
                        }
                      >
                        <SelectTrigger className="h-8 text-xs" aria-label="Instruction type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Markdown">Markdown</SelectItem>
                          <SelectItem value="CopyableLabel">Copyable Label</SelectItem>
                          <SelectItem value="Textbox">Textbox</SelectItem>
                          <SelectItem value="Dropdown">Dropdown</SelectItem>
                          <SelectItem value="OAuthForm">OAuth Form</SelectItem>
                          <SelectItem value="ConnectionToggleButton">Connection Toggle</SelectItem>
                          <SelectItem value="InfoMessage">Info Message</SelectItem>
                          <SelectItem value="InstructionStepsGroup">Steps Group</SelectItem>
                          <SelectItem value="DeployPushConnectorButton">Deploy Button</SelectItem>
                          <SelectItem value="InstallAgent">Install Agent</SelectItem>
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

                    <InstructionTypeRenderer
                      instruction={instr}
                      onParamChange={(key, value) =>
                        handleParamChange(stepIndex, instrIndex, instr, key, value)
                      }
                    />
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

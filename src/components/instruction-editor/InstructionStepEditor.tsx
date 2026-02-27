import type { InstructionStep, Instruction } from "@/lib/schemas"
import { updateAtIndex } from "@/lib/array-utils"
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

const INSTALL_AGENT_LINK_TYPES = [
  "InstallAgentOnWindowsVirtualMachine",
  "InstallAgentOnWindowsNonAzure",
  "InstallAgentOnLinuxVirtualMachine",
  "InstallAgentOnLinuxNonAzure",
  "OpenSyslogSettings",
  "OpenCustomLogsSettings",
  "OpenWaf",
  "OpenAzureFirewall",
  "OpenMicrosoftAzureMonitoring",
  "OpenFrontDoors",
  "OpenCdnProfile",
  "AutomaticDeploymentCEF",
  "OpenAzureInformationProtection",
  "OpenAzureActivityLog",
  "OpenIotPricingModel",
  "OpenPolicyAssignment",
  "OpenAllAssignmentsBlade",
  "OpenCreateDataCollectionRule",
] as const

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
    onChange(updateAtIndex(steps, index, updates))
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
    updateStep(stepIndex, {
      instructions: updateAtIndex(steps[stepIndex].instructions, instrIndex, instr),
    })
  }

  const changeInstructionType = (
    stepIndex: number,
    instrIndex: number,
    newType: Instruction["type"],
  ) => {
    updateInstruction(stepIndex, instrIndex, {
      type: newType,
      parameters: defaultParametersForType(newType),
    })
  }

  const updateParam = (
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
              {step.instructions.map((instr, instrIndex) => {
                const p = instr.parameters as Record<string, unknown>
                return (
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

                      {/* --- Markdown --- */}
                      {instr.type === "Markdown" && (
                        <Textarea
                          value={(p.content as string) || ""}
                          onChange={(e) =>
                            updateParam(stepIndex, instrIndex, instr, "content", e.target.value)
                          }
                          placeholder="Markdown content..."
                          rows={2}
                          className="text-xs"
                        />
                      )}

                      {/* --- CopyableLabel --- */}
                      {instr.type === "CopyableLabel" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={(p.label as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "label", e.target.value)
                            }
                            placeholder="Label"
                            className="text-xs"
                          />
                          <Input
                            value={(p.value as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "value", e.target.value)
                            }
                            placeholder="Value (or fillWith)"
                            className="text-xs"
                          />
                        </div>
                      )}

                      {/* --- Textbox --- */}
                      {instr.type === "Textbox" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={(p.label as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "label", e.target.value)
                            }
                            placeholder="Label"
                            className="text-xs"
                          />
                          <Input
                            value={(p.name as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "name", e.target.value)
                            }
                            placeholder="Field name (e.g. username)"
                            className="text-xs"
                          />
                          <Input
                            value={(p.placeholder as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "placeholder", e.target.value)
                            }
                            placeholder="Placeholder text"
                            className="text-xs"
                          />
                          <Select
                            value={(p.type as string) || "text"}
                            onValueChange={(v) =>
                              updateParam(stepIndex, instrIndex, instr, "type", v)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs" aria-label="Input type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">text</SelectItem>
                              <SelectItem value="password">password</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="email">email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* --- OAuthForm --- */}
                      {instr.type === "OAuthForm" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={(p.clientIdLabel as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "clientIdLabel", e.target.value)
                            }
                            placeholder="Client ID label"
                            className="text-xs"
                          />
                          <Input
                            value={(p.clientSecretLabel as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "clientSecretLabel", e.target.value)
                            }
                            placeholder="Client secret label"
                            className="text-xs"
                          />
                          <Input
                            value={(p.connectButtonLabel as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "connectButtonLabel", e.target.value)
                            }
                            placeholder="Connect button label"
                            className="text-xs"
                          />
                          <Input
                            value={(p.disconnectButtonLabel as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "disconnectButtonLabel", e.target.value)
                            }
                            placeholder="Disconnect button label"
                            className="text-xs"
                          />
                        </div>
                      )}

                      {/* --- Dropdown --- */}
                      {instr.type === "Dropdown" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={(p.label as string) || ""}
                              onChange={(e) =>
                                updateParam(stepIndex, instrIndex, instr, "label", e.target.value)
                              }
                              placeholder="Label"
                              className="text-xs"
                            />
                            <Input
                              value={(p.name as string) || ""}
                              onChange={(e) =>
                                updateParam(stepIndex, instrIndex, instr, "name", e.target.value)
                              }
                              placeholder="Field name"
                              className="text-xs"
                            />
                            <Input
                              value={(p.placeholder as string) || ""}
                              onChange={(e) =>
                                updateParam(stepIndex, instrIndex, instr, "placeholder", e.target.value)
                              }
                              placeholder="Placeholder"
                              className="text-xs"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Options can be added by editing the JSON directly. Each option requires a <code>key</code> and <code>text</code> field.
                          </p>
                        </div>
                      )}

                      {/* --- ConnectionToggleButton --- */}
                      {instr.type === "ConnectionToggleButton" && (
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={(p.name as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "name", e.target.value)
                            }
                            placeholder="name (e.g. toggle)"
                            className="text-xs"
                          />
                          <Input
                            value={(p.connectLabel as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "connectLabel", e.target.value)
                            }
                            placeholder="Connect label"
                            className="text-xs"
                          />
                          <Input
                            value={(p.disconnectLabel as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "disconnectLabel", e.target.value)
                            }
                            placeholder="Disconnect label"
                            className="text-xs"
                          />
                        </div>
                      )}

                      {/* --- InfoMessage --- */}
                      {instr.type === "InfoMessage" && (
                        <div className="space-y-2">
                          <Textarea
                            value={(p.text as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "text", e.target.value)
                            }
                            placeholder="Message text..."
                            rows={2}
                            className="text-xs"
                          />
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(p.inline as boolean) ?? true}
                                onChange={(e) =>
                                  updateParam(stepIndex, instrIndex, instr, "inline", e.target.checked)
                                }
                                aria-label="Inline message"
                              />
                              Inline
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(p.visible as boolean) ?? true}
                                onChange={(e) =>
                                  updateParam(stepIndex, instrIndex, instr, "visible", e.target.checked)
                                }
                                aria-label="Visible message"
                              />
                              Visible
                            </label>
                          </div>
                        </div>
                      )}

                      {/* --- InstructionStepsGroup --- */}
                      {instr.type === "InstructionStepsGroup" && (
                        <div className="space-y-2">
                          <Input
                            value={(p.title as string) || ""}
                            onChange={(e) =>
                              updateParam(stepIndex, instrIndex, instr, "title", e.target.value)
                            }
                            placeholder="Group title"
                            className="text-xs"
                          />
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(p.canCollapseAllSections as boolean) ?? true}
                                onChange={(e) =>
                                  updateParam(stepIndex, instrIndex, instr, "canCollapseAllSections", e.target.checked)
                                }
                                aria-label="Collapsible sections"
                              />
                              Collapsible
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(p.expanded as boolean) ?? false}
                                onChange={(e) =>
                                  updateParam(stepIndex, instrIndex, instr, "expanded", e.target.checked)
                                }
                                aria-label="Expanded by default"
                              />
                              Expanded by default
                            </label>
                          </div>
                        </div>
                      )}

                      {/* --- InstallAgent --- */}
                      {instr.type === "InstallAgent" && (
                        <Select
                          value={(p.linkType as string) || "InstallAgentOnWindowsVirtualMachine"}
                          onValueChange={(v) =>
                            updateParam(stepIndex, instrIndex, instr, "linkType", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs" aria-label="Link type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INSTALL_AGENT_LINK_TYPES.map((lt) => (
                              <SelectItem key={lt} value={lt}>{lt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* --- DeployPushConnectorButton --- */}
                      {instr.type === "DeployPushConnectorButton" && (
                        <p className="text-xs text-muted-foreground italic">
                          Deploy button — auto-configured from connector ID.
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
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

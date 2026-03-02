import type { Instruction } from "@/lib/schemas"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

interface InstructionRendererProps {
  instruction: Instruction
  onParamChange: (key: string, value: unknown) => void
}

function MarkdownRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <Textarea
      value={(p.content as string) || ""}
      onChange={(e) => onParamChange("content", e.target.value)}
      placeholder="Markdown content..."
      rows={2}
      className="text-xs"
    />
  )
}

function CopyableLabelRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        value={(p.label as string) || ""}
        onChange={(e) => onParamChange("label", e.target.value)}
        placeholder="Label"
        className="text-xs"
      />
      <Input
        value={(p.value as string) || ""}
        onChange={(e) => onParamChange("value", e.target.value)}
        placeholder="Value (or fillWith)"
        className="text-xs"
      />
    </div>
  )
}

function TextboxRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        value={(p.label as string) || ""}
        onChange={(e) => onParamChange("label", e.target.value)}
        placeholder="Label"
        className="text-xs"
      />
      <Input
        value={(p.name as string) || ""}
        onChange={(e) => onParamChange("name", e.target.value)}
        placeholder="Field name (e.g. username)"
        className="text-xs"
      />
      <Input
        value={(p.placeholder as string) || ""}
        onChange={(e) => onParamChange("placeholder", e.target.value)}
        placeholder="Placeholder text"
        className="text-xs"
      />
      <Select
        value={(p.type as string) || "text"}
        onValueChange={(v) => onParamChange("type", v)}
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
  )
}

function OAuthFormRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        value={(p.clientIdLabel as string) || ""}
        onChange={(e) => onParamChange("clientIdLabel", e.target.value)}
        placeholder="Client ID label"
        className="text-xs"
      />
      <Input
        value={(p.clientSecretLabel as string) || ""}
        onChange={(e) => onParamChange("clientSecretLabel", e.target.value)}
        placeholder="Client secret label"
        className="text-xs"
      />
      <Input
        value={(p.connectButtonLabel as string) || ""}
        onChange={(e) => onParamChange("connectButtonLabel", e.target.value)}
        placeholder="Connect button label"
        className="text-xs"
      />
      <Input
        value={(p.disconnectButtonLabel as string) || ""}
        onChange={(e) => onParamChange("disconnectButtonLabel", e.target.value)}
        placeholder="Disconnect button label"
        className="text-xs"
      />
    </div>
  )
}

function DropdownRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={(p.label as string) || ""}
          onChange={(e) => onParamChange("label", e.target.value)}
          placeholder="Label"
          className="text-xs"
        />
        <Input
          value={(p.name as string) || ""}
          onChange={(e) => onParamChange("name", e.target.value)}
          placeholder="Field name"
          className="text-xs"
        />
        <Input
          value={(p.placeholder as string) || ""}
          onChange={(e) => onParamChange("placeholder", e.target.value)}
          placeholder="Placeholder"
          className="text-xs"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Options can be added by editing the JSON directly. Each option requires a <code>key</code> and <code>text</code> field.
      </p>
    </div>
  )
}

function ConnectionToggleRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <div className="grid grid-cols-3 gap-2">
      <Input
        value={(p.name as string) || ""}
        onChange={(e) => onParamChange("name", e.target.value)}
        placeholder="name (e.g. toggle)"
        className="text-xs"
      />
      <Input
        value={(p.connectLabel as string) || ""}
        onChange={(e) => onParamChange("connectLabel", e.target.value)}
        placeholder="Connect label"
        className="text-xs"
      />
      <Input
        value={(p.disconnectLabel as string) || ""}
        onChange={(e) => onParamChange("disconnectLabel", e.target.value)}
        placeholder="Disconnect label"
        className="text-xs"
      />
    </div>
  )
}

function InfoMessageRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <div className="space-y-2">
      <Textarea
        value={(p.text as string) || ""}
        onChange={(e) => onParamChange("text", e.target.value)}
        placeholder="Message text..."
        rows={2}
        className="text-xs"
      />
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={(p.inline as boolean) ?? true}
            onChange={(e) => onParamChange("inline", e.target.checked)}
            aria-label="Inline message"
          />
          Inline
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={(p.visible as boolean) ?? true}
            onChange={(e) => onParamChange("visible", e.target.checked)}
            aria-label="Visible message"
          />
          Visible
        </label>
      </div>
    </div>
  )
}

function InstructionStepsGroupRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <div className="space-y-2">
      <Input
        value={(p.title as string) || ""}
        onChange={(e) => onParamChange("title", e.target.value)}
        placeholder="Group title"
        className="text-xs"
      />
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={(p.canCollapseAllSections as boolean) ?? true}
            onChange={(e) => onParamChange("canCollapseAllSections", e.target.checked)}
            aria-label="Collapsible sections"
          />
          Collapsible
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={(p.expanded as boolean) ?? false}
            onChange={(e) => onParamChange("expanded", e.target.checked)}
            aria-label="Expanded by default"
          />
          Expanded by default
        </label>
      </div>
    </div>
  )
}

function InstallAgentRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const p = instruction.parameters as Record<string, unknown>
  return (
    <Select
      value={(p.linkType as string) || "InstallAgentOnWindowsVirtualMachine"}
      onValueChange={(v) => onParamChange("linkType", v)}
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
  )
}

function DeployPushConnectorRenderer() {
  return (
    <p className="text-xs text-muted-foreground italic">
      Deploy button — auto-configured from connector ID.
    </p>
  )
}

const INSTRUCTION_RENDERERS: Record<
  Instruction["type"],
  React.ComponentType<InstructionRendererProps>
> = {
  Markdown: MarkdownRenderer,
  CopyableLabel: CopyableLabelRenderer,
  Textbox: TextboxRenderer,
  OAuthForm: OAuthFormRenderer,
  Dropdown: DropdownRenderer,
  ConnectionToggleButton: ConnectionToggleRenderer,
  InfoMessage: InfoMessageRenderer,
  InstructionStepsGroup: InstructionStepsGroupRenderer,
  InstallAgent: InstallAgentRenderer,
  DeployPushConnectorButton: DeployPushConnectorRenderer,
}

export function InstructionTypeRenderer({ instruction, onParamChange }: InstructionRendererProps) {
  const Renderer = INSTRUCTION_RENDERERS[instruction.type]
  if (!Renderer) return null
  return <Renderer instruction={instruction} onParamChange={onParamChange} />
}

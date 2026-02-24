import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function StepSolution() {
  const { config, updateSolution } = useConnectorConfig()
  const { solution } = config

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Solution Identity</CardTitle>
          <CardDescription>
            Publisher and offer details used to identify your solution in
            Microsoft Sentinel Content Hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="solutionName">Solution Name</Label>
            <Input
              id="solutionName"
              placeholder="e.g., ContosoSecuritySolution"
              value={solution.name}
              onChange={(e) => updateSolution({ name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Name used for the solution package folder. Defaults to the first
              connector ID if empty.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publisherId">Publisher ID *</Label>
              <Input
                id="publisherId"
                placeholder="contoso"
                value={solution.publisherId}
                onChange={(e) =>
                  updateSolution({ publisherId: e.target.value.toLowerCase() })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, no spaces. Used in Content Hub.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offerId">Offer ID *</Label>
              <Input
                id="offerId"
                placeholder="contoso-security-alerts"
                value={solution.offerId}
                onChange={(e) =>
                  updateSolution({ offerId: e.target.value.toLowerCase() })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with hyphens. Globally unique.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                value={solution.version}
                onChange={(e) => updateSolution({ version: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportTier">Support Tier *</Label>
              <Select
                value={solution.support.tier}
                onValueChange={(v) =>
                  updateSolution({
                    support: {
                      ...solution.support,
                      tier: v as "Microsoft" | "Partner" | "Community",
                    },
                  })
                }
              >
                <SelectTrigger id="supportTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Microsoft">Microsoft</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support Contact</CardTitle>
          <CardDescription>
            Contact information shown to users of your solution in Content Hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supportName">Support Name *</Label>
            <Input
              id="supportName"
              placeholder="Contoso Support"
              value={solution.support.name}
              onChange={(e) =>
                updateSolution({
                  support: { ...solution.support, name: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email *</Label>
            <Input
              id="supportEmail"
              type="email"
              placeholder="support@contoso.com"
              value={solution.support.email}
              onChange={(e) =>
                updateSolution({
                  support: { ...solution.support, email: e.target.value },
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Used in the solution Author field for Content Hub.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportLink">Support Link</Label>
            <Input
              id="supportLink"
              placeholder="https://support.contoso.com"
              value={solution.support.link}
              onChange={(e) =>
                updateSolution({
                  support: { ...solution.support, link: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

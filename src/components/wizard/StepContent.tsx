import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { HelpCircle } from "lucide-react"
import { AnalyticRulesEditor } from "./content/AnalyticRulesEditor"
import { HuntingQueriesEditor } from "./content/HuntingQueriesEditor"
import { AsimParsersEditor } from "./content/AsimParsersEditor"
import { WorkbooksEditor } from "./content/WorkbooksEditor"

export function StepContent() {
  const { analyticRules, huntingQueries, asimParsers, workbooks } = useConnectorConfig()
  const [activeTab, setActiveTab] = React.useState("rules")

  return (
    <div className="space-y-6">
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <HelpCircle className="w-4 h-4" />
          What are analytic rules, hunting queries, ASIM parsers, and workbooks?
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 text-sm text-muted-foreground space-y-2 pl-6">
          <p>
            <strong>Analytic Rules</strong> are threat detection logic that runs
            against your ingested data. They use KQL queries to identify
            suspicious patterns and generate security alerts in Microsoft
            Sentinel.
          </p>
          <p>
            <strong>Hunting Queries</strong> are investigator-focused KQL queries
            that help analysts proactively hunt for suspicious behavior without
            creating alerts.
          </p>
          <p>
            <strong>ASIM Parsers</strong> (Advanced Security Information Model)
            are KQL functions that normalize your data into standard schemas,
            enabling cross-source analytics and built-in Sentinel workbooks.
          </p>
          <p>
            <strong>Workbooks</strong> are interactive dashboards built in Azure
            Monitor. Export the gallery template JSON from the Azure portal and
            paste it here to include it in your solution package.
          </p>
          <p>
            All four are optional solution-level content — not tied to individual
            connectors.
          </p>
        </CollapsibleContent>
      </Collapsible>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">
            Analytic Rules
            {analyticRules.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                {analyticRules.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="parsers">
            ASIM Parsers
            {asimParsers.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                {asimParsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hunting">
            Hunting Queries
            {huntingQueries.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                {huntingQueries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="workbooks">
            Workbooks
            {workbooks.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                {workbooks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <AnalyticRulesEditor />
        </TabsContent>

        <TabsContent value="parsers">
          <AsimParsersEditor />
        </TabsContent>

        <TabsContent value="hunting">
          <HuntingQueriesEditor />
        </TabsContent>

        <TabsContent value="workbooks">
          <WorkbooksEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}

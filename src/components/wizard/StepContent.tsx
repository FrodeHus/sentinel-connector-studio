import * as React from "react"
import { useConnectorConfig } from "@/hooks/useConnectorConfig"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AnalyticRulesEditor } from "./content/AnalyticRulesEditor"
import { HuntingQueriesEditor } from "./content/HuntingQueriesEditor"
import { AsimParsersEditor } from "./content/AsimParsersEditor"
import { WorkbooksEditor } from "./content/WorkbooksEditor"

export function StepContent() {
  const { analyticRules, huntingQueries, asimParsers, workbooks } = useConnectorConfig()
  const [activeTab, setActiveTab] = React.useState("rules")

  return (
    <div className="space-y-6">
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

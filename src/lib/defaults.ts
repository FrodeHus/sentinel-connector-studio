import type { ConnectorUI, GraphQuery, SampleQuery, ConnectivityCriteria, InstructionStep, Column } from "./schemas"

export function generateDefaultGraphQueries(_tableName: string): GraphQuery[] {
  return [
    {
      metricName: "Total events received",
      legend: "Events",
      baseQuery: `{{graphQueriesTableName}}`,
    },
  ]
}

export function generateDefaultSampleQueries(tableName: string, columns: Column[]): SampleQuery[] {
  const queries: SampleQuery[] = [
    {
      description: "All events",
      query: `${tableName}\n| sort by TimeGenerated desc\n| take 10`,
    },
  ]

  const stringCol = columns.find(c => c.type === "string" && c.name !== "TimeGenerated")
  if (stringCol) {
    queries.push({
      description: `Events by ${stringCol.name}`,
      query: `${tableName}\n| summarize count() by ${stringCol.name}\n| sort by count_ desc`,
    })
  }

  return queries
}

export function generateDefaultConnectivityCriteria(tableName: string): ConnectivityCriteria[] {
  return [
    {
      type: "IsConnectedQuery",
      value: [`${tableName}\n| summarize LastLogReceived = max(TimeGenerated)\n| project IsConnected = LastLogReceived > ago(30d)`],
    },
  ]
}

export function generateDefaultPermissions() {
  return {
    resourceProvider: [
      {
        provider: "Microsoft.OperationalInsights/workspaces",
        permissionsDisplayText: "Read and Write permissions on the Log Analytics workspace.",
        providerDisplayName: "Workspace",
        scope: "Workspace",
        requiredPermissions: { write: true, read: true, delete: false, action: false },
      },
      {
        provider: "Microsoft.OperationalInsights/workspaces/sharedKeys",
        permissionsDisplayText: "Read permissions to shared keys for the workspace.",
        providerDisplayName: "Keys",
        scope: "Workspace",
        requiredPermissions: { write: false, read: true, delete: false, action: true },
      },
    ],
    customs: [
      {
        name: "Microsoft Entra application",
        description: "Permissions to create or use an existing Microsoft Entra application for data ingestion.",
      },
      {
        name: "Azure RBAC",
        description: "Monitoring Metrics Publisher role assignment on the Data Collection Rule resource.",
      },
    ],
  }
}

export function generateDefaultInstructionSteps(
  connectorId: string,
  _tableName: string,
  streamName: string,
): InstructionStep[] {
  return [
    {
      title: "Deploy the Push Connector",
      description:
        "Click the **Deploy to Azure** button below to deploy the required resources.",
      instructions: [
        {
          type: "DeployPushConnectorButton" as const,
          parameters: {
            label: `Deploy ${connectorId} Push connector resources`,
            applicationDisplayName: `${connectorId} Push Connector Application`,
          },
        },
      ],
    },
    {
      title: "Configure Your Application",
      description:
        "Use the following connection details to configure your application to send data to this connector.",
      instructions: [
        {
          type: "CopyableLabel" as const,
          parameters: {
            label: "Tenant ID",
            fillWith: ["TenantId"],
            isBlankValueEnabled: true,
          },
        },
        {
          type: "CopyableLabel" as const,
          parameters: {
            label: "Application (Client) ID",
            fillWith: ["ApplicationId"],
            isBlankValueEnabled: true,
          },
        },
        {
          type: "CopyableLabel" as const,
          parameters: {
            label: "Application Client Secret",
            fillWith: ["ApplicationSecret"],
            isBlankValueEnabled: true,
          },
        },
        {
          type: "CopyableLabel" as const,
          parameters: {
            label: "Data Collection Endpoint",
            fillWith: ["DataCollectionEndpoint"],
            isBlankValueEnabled: true,
          },
        },
        {
          type: "CopyableLabel" as const,
          parameters: {
            label: "Data Collection Rule ID",
            fillWith: ["DataCollectionRuleId"],
            isBlankValueEnabled: true,
          },
        },
        {
          type: "CopyableLabel" as const,
          parameters: {
            label: "Stream Name",
            value: streamName,
            isBlankValueEnabled: true,
          },
        },
      ],
    },
  ];
}

export function generateDefaultConnectorUI(connectorId: string, tableName: string, streamName: string, columns: Column[]): ConnectorUI {
  return {
    graphQueries: generateDefaultGraphQueries(tableName),
    sampleQueries: generateDefaultSampleQueries(tableName, columns),
    connectivityCriteria: generateDefaultConnectivityCriteria(tableName),
    permissions: generateDefaultPermissions(),
    instructionSteps: generateDefaultInstructionSteps(connectorId, tableName, streamName),
  }
}

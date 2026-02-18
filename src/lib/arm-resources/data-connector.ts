import type { Meta, DataFlow } from "../schemas"
import {
  connectorIdToConnectorDefName,
  connectorIdToConnectorConfigName,
} from "../naming";

export function generateDataConnector(meta: Meta, dataFlow: DataFlow) {
  const connectorDefName = connectorIdToConnectorDefName(meta.connectorId);
  const connectorConfigName = connectorIdToConnectorConfigName(
    meta.connectorId,
  );

  return {
    name: connectorConfigName,
    apiVersion: "2024-09-01",
    type: "Microsoft.SecurityInsights/dataConnectors",
    kind: "Push",
    properties: {
      connectorDefinitionName: connectorDefName,
      dcrConfig: {
        streamName: dataFlow.streamName,
        dataCollectionEndpoint:
          "[[parameters('dcrConfig').dataCollectionEndpoint]",
        dataCollectionRuleImmutableId:
          "[[parameters('dcrConfig').dataCollectionRuleImmutableId]",
      },
      auth: {
        type: "Push",
        AppId: "[[parameters('auth').appId]",
        ServicePrincipalId: "[[parameters('auth').servicePrincipalId]",
      },
      request: {
        RetryCount: 1,
      },
      response: {
        eventsJsonPaths: ["$"],
      },
    },
  };
}

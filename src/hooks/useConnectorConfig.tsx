import * as React from "react"
import type { ConnectorConfig, ConnectorData, AppState, PollerConfig } from "@/lib/schemas"
import { ConnectorDataSchema, AppStateSchema, PollerConfigSchema } from "@/lib/schemas"
import { saveConfig, loadConfig, clearConfig } from "@/lib/persistence"

interface ConnectorConfigContextValue {
  /** Combined view: active connector data + shared solution (backwards-compatible shape) */
  config: ConnectorConfig
  updateConfig: (updater: (prev: ConnectorConfig) => ConnectorConfig) => void
  updateMeta: (meta: Partial<ConnectorConfig["meta"]>) => void
  updateSchema: (schema: Partial<ConnectorConfig["schema"]>) => void
  updateDataFlow: (dataFlow: Partial<ConnectorConfig["dataFlow"]>) => void
  updateConnectorUI: (connectorUI: Partial<ConnectorConfig["connectorUI"]>) => void
  updatePollerConfig: (updater: (prev: PollerConfig) => PollerConfig) => void
  updateSolution: (solution: Partial<ConnectorConfig["solution"]>) => void
  reset: () => void
  hasSavedConfig: boolean
  dismissSavedConfig: () => void
  resumeSavedConfig: () => void

  // Multi-connector API
  connectors: ConnectorData[]
  activeConnectorIndex: number
  addConnector: () => void
  removeConnector: (index: number) => void
  setActiveConnector: (index: number) => void
}

const ConnectorConfigContext = React.createContext<ConnectorConfigContextValue | null>(null)

function createDefaultAppState(): AppState {
  return AppStateSchema.parse({})
}

export function ConnectorConfigProvider({ children }: { children: React.ReactNode }) {
  const [hasSavedConfig, setHasSavedConfig] = React.useState(false)
  const [appState, setAppState] = React.useState<AppState>(createDefaultAppState)
  const savedStateRef = React.useRef<AppState | null>(null)

  React.useEffect(() => {
    const saved = loadConfig()
    if (saved) {
      savedStateRef.current = saved
      setHasSavedConfig(true)
    }
  }, [])

  // Don't auto-save while the resume banner is showing — that would overwrite
  // the previously saved config with the fresh defaults before the user decides.
  React.useEffect(() => {
    if (!hasSavedConfig) {
      saveConfig(appState)
    }
  }, [appState, hasSavedConfig])

  // Computed backwards-compatible config: active connector + shared solution
  const config = React.useMemo<ConnectorConfig>(() => {
    const c = appState.connectors[appState.activeConnectorIndex] ?? appState.connectors[0]
    return {
      meta: c.meta,
      schema: c.schema,
      dataFlow: c.dataFlow,
      connectorUI: c.connectorUI,
      pollerConfig: c.pollerConfig,
      solution: appState.solution,
    }
  }, [appState])

  // Helper to update the active connector
  const updateActiveConnector = React.useCallback(
    (updater: (prev: ConnectorData) => ConnectorData) => {
      setAppState((prev) => {
        const updated = [...prev.connectors]
        updated[prev.activeConnectorIndex] = updater(updated[prev.activeConnectorIndex])
        return { ...prev, connectors: updated }
      })
    },
    [],
  )

  const updateConfig = React.useCallback(
    (updater: (prev: ConnectorConfig) => ConnectorConfig) => {
      setAppState((prev) => {
        const activeConnector = prev.connectors[prev.activeConnectorIndex]
        const oldConfig: ConnectorConfig = {
          ...activeConnector,
          solution: prev.solution,
        }
        const newConfig = updater(oldConfig)
        const updatedConnectors = [...prev.connectors]
        updatedConnectors[prev.activeConnectorIndex] = {
          meta: newConfig.meta,
          schema: newConfig.schema,
          dataFlow: newConfig.dataFlow,
          connectorUI: newConfig.connectorUI,
          pollerConfig: newConfig.pollerConfig,
        }
        return {
          ...prev,
          connectors: updatedConnectors,
          solution: newConfig.solution,
        }
      })
    },
    [],
  )

  const updateMeta = React.useCallback(
    (meta: Partial<ConnectorConfig["meta"]>) => {
      updateActiveConnector((prev) => ({ ...prev, meta: { ...prev.meta, ...meta } }))
    },
    [updateActiveConnector],
  )

  const updateSchema = React.useCallback(
    (schema: Partial<ConnectorConfig["schema"]>) => {
      updateActiveConnector((prev) => ({ ...prev, schema: { ...prev.schema, ...schema } }))
    },
    [updateActiveConnector],
  )

  const updateDataFlow = React.useCallback(
    (dataFlow: Partial<ConnectorConfig["dataFlow"]>) => {
      updateActiveConnector((prev) => ({ ...prev, dataFlow: { ...prev.dataFlow, ...dataFlow } }))
    },
    [updateActiveConnector],
  )

  const updateConnectorUI = React.useCallback(
    (connectorUI: Partial<ConnectorConfig["connectorUI"]>) => {
      updateActiveConnector((prev) => ({
        ...prev,
        connectorUI: { ...prev.connectorUI, ...connectorUI },
      }))
    },
    [updateActiveConnector],
  )

  const updatePollerConfig = React.useCallback(
    (updater: (prev: PollerConfig) => PollerConfig) => {
      updateActiveConnector((prev) => ({
        ...prev,
        pollerConfig: updater(prev.pollerConfig ?? PollerConfigSchema.parse({})),
      }))
    },
    [updateActiveConnector],
  )

  const updateSolution = React.useCallback(
    (solution: Partial<ConnectorConfig["solution"]>) => {
      setAppState((prev) => ({ ...prev, solution: { ...prev.solution, ...solution } }))
    },
    [],
  )

  const addConnector = React.useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      connectors: [...prev.connectors, ConnectorDataSchema.parse({})],
      activeConnectorIndex: prev.connectors.length,
    }))
  }, [])

  const removeConnector = React.useCallback((index: number) => {
    setAppState((prev) => {
      if (prev.connectors.length <= 1) return prev
      const updated = prev.connectors.filter((_, i) => i !== index)
      return {
        ...prev,
        connectors: updated,
        activeConnectorIndex: Math.min(prev.activeConnectorIndex, updated.length - 1),
      }
    })
  }, [])

  const setActiveConnector = React.useCallback((index: number) => {
    setAppState((prev) => {
      if (index < 0 || index >= prev.connectors.length) return prev
      return { ...prev, activeConnectorIndex: index }
    })
  }, [])

  const reset = React.useCallback(() => {
    clearConfig()
    setAppState(createDefaultAppState())
    setHasSavedConfig(false)
  }, [])

  const dismissSavedConfig = React.useCallback(() => {
    setHasSavedConfig(false)
  }, [])

  const resumeSavedConfig = React.useCallback(() => {
    if (savedStateRef.current) {
      setAppState(savedStateRef.current)
      savedStateRef.current = null
    }
    setHasSavedConfig(false)
  }, [])

  const value = React.useMemo(
    () => ({
      config,
      updateConfig,
      updateMeta,
      updateSchema,
      updateDataFlow,
      updateConnectorUI,
      updatePollerConfig,
      updateSolution,
      reset,
      hasSavedConfig,
      dismissSavedConfig,
      resumeSavedConfig,
      connectors: appState.connectors,
      activeConnectorIndex: appState.activeConnectorIndex,
      addConnector,
      removeConnector,
      setActiveConnector,
    }),
    [
      config,
      updateConfig,
      updateMeta,
      updateSchema,
      updateDataFlow,
      updateConnectorUI,
      updatePollerConfig,
      updateSolution,
      reset,
      hasSavedConfig,
      dismissSavedConfig,
      resumeSavedConfig,
      appState.connectors,
      appState.activeConnectorIndex,
      addConnector,
      removeConnector,
      setActiveConnector,
    ],
  )

  return (
    <ConnectorConfigContext.Provider value={value}>
      {children}
    </ConnectorConfigContext.Provider>
  )
}

export function useConnectorConfig() {
  const context = React.useContext(ConnectorConfigContext)
  if (!context) {
    throw new Error("useConnectorConfig must be used within a ConnectorConfigProvider")
  }
  return context
}

import * as React from "react"
import type { ConnectorConfig } from "@/lib/schemas"
import { ConnectorConfigSchema } from "@/lib/schemas"
import { saveConfig, loadConfig, clearConfig } from "@/lib/persistence"

interface ConnectorConfigContextValue {
  config: ConnectorConfig
  updateConfig: (updater: (prev: ConnectorConfig) => ConnectorConfig) => void
  updateMeta: (meta: Partial<ConnectorConfig["meta"]>) => void
  updateSchema: (schema: Partial<ConnectorConfig["schema"]>) => void
  updateDataFlow: (dataFlow: Partial<ConnectorConfig["dataFlow"]>) => void
  updateConnectorUI: (connectorUI: Partial<ConnectorConfig["connectorUI"]>) => void
  updateSolution: (solution: Partial<ConnectorConfig["solution"]>) => void
  reset: () => void
  hasSavedConfig: boolean
  dismissSavedConfig: () => void
  resumeSavedConfig: () => void
}

const ConnectorConfigContext = React.createContext<ConnectorConfigContextValue | null>(null)

function createDefaultConfig(): ConnectorConfig {
  return ConnectorConfigSchema.parse({})
}

export function ConnectorConfigProvider({ children }: { children: React.ReactNode }) {
  const [hasSavedConfig, setHasSavedConfig] = React.useState(false)
  const [config, setConfig] = React.useState<ConnectorConfig>(createDefaultConfig)
  const savedConfigRef = React.useRef<ConnectorConfig | null>(null)

  React.useEffect(() => {
    const saved = loadConfig()
    if (saved) {
      savedConfigRef.current = saved
      setHasSavedConfig(true)
    }
  }, [])

  // Don't auto-save while the resume banner is showing — that would overwrite
  // the previously saved config with the fresh defaults before the user decides.
  React.useEffect(() => {
    if (!hasSavedConfig) {
      saveConfig(config)
    }
  }, [config, hasSavedConfig])

  const updateConfig = React.useCallback((updater: (prev: ConnectorConfig) => ConnectorConfig) => {
    setConfig(updater)
  }, [])

  const updateMeta = React.useCallback((meta: Partial<ConnectorConfig["meta"]>) => {
    setConfig(prev => ({ ...prev, meta: { ...prev.meta, ...meta } }))
  }, [])

  const updateSchema = React.useCallback((schema: Partial<ConnectorConfig["schema"]>) => {
    setConfig(prev => ({ ...prev, schema: { ...prev.schema, ...schema } }))
  }, [])

  const updateDataFlow = React.useCallback((dataFlow: Partial<ConnectorConfig["dataFlow"]>) => {
    setConfig(prev => ({ ...prev, dataFlow: { ...prev.dataFlow, ...dataFlow } }))
  }, [])

  const updateConnectorUI = React.useCallback((connectorUI: Partial<ConnectorConfig["connectorUI"]>) => {
    setConfig(prev => ({ ...prev, connectorUI: { ...prev.connectorUI, ...connectorUI } }))
  }, [])

  const updateSolution = React.useCallback((solution: Partial<ConnectorConfig["solution"]>) => {
    setConfig(prev => ({ ...prev, solution: { ...prev.solution, ...solution } }))
  }, [])

  const reset = React.useCallback(() => {
    clearConfig()
    setConfig(createDefaultConfig())
    setHasSavedConfig(false)
  }, [])

  const dismissSavedConfig = React.useCallback(() => {
    setHasSavedConfig(false)
  }, [])

  const resumeSavedConfig = React.useCallback(() => {
    if (savedConfigRef.current) {
      setConfig(savedConfigRef.current)
      savedConfigRef.current = null
    }
    setHasSavedConfig(false)
  }, [])

  const value = React.useMemo(() => ({
    config,
    updateConfig,
    updateMeta,
    updateSchema,
    updateDataFlow,
    updateConnectorUI,
    updateSolution,
    reset,
    hasSavedConfig,
    dismissSavedConfig,
    resumeSavedConfig,
  }), [config, updateConfig, updateMeta, updateSchema, updateDataFlow, updateConnectorUI, updateSolution, reset, hasSavedConfig, dismissSavedConfig, resumeSavedConfig])

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

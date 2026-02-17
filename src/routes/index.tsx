import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ConnectorConfigProvider } from '@/hooks/useConnectorConfig'
import { ThemeProvider } from '@/hooks/useTheme'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sentinel CCF Push Connector Builder</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <ClientWizard />
}

// Lazy load the wizard to avoid SSR issues with CodeMirror, localStorage, etc.
const LazyConnectorWizard = React.lazy(() =>
  import('@/components/wizard/ConnectorWizard').then(m => ({ default: m.ConnectorWizard }))
)

function ClientWizard() {
  return (
    <ThemeProvider>
      <ConnectorConfigProvider>
        <React.Suspense
          fallback={
            <div className="h-screen flex items-center justify-center">
              <p className="text-muted-foreground">Loading wizard...</p>
            </div>
          }
        >
          <LazyConnectorWizard />
        </React.Suspense>
      </ConnectorConfigProvider>
    </ThemeProvider>
  )
}

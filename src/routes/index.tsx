import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ConnectorConfigProvider } from '@/hooks/useConnectorConfig'
import { ThemeProvider } from '@/hooks/useTheme'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface ProjectSearchParams {
  project?: string;
}

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>): ProjectSearchParams => ({
    project: typeof search.project === "string" ? search.project : undefined,
  }),
});

function App() {
  const { project } = Route.useSearch();
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sentinel Connector Studio</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <ClientWizard projectUrl={project} />;
}

// Lazy load the wizard to avoid SSR issues with CodeMirror, localStorage, etc.
const LazyConnectorWizard = React.lazy(() =>
  import('@/components/wizard/ConnectorWizard').then(m => ({ default: m.ConnectorWizard }))
)

function ClientWizard({ projectUrl }: { projectUrl?: string }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ConnectorConfigProvider>
          <TooltipProvider>
            <React.Suspense
              fallback={
                <div className="h-screen flex items-center justify-center">
                  <p className="text-muted-foreground">Loading wizard...</p>
                </div>
              }
            >
              <LazyConnectorWizard initialProjectUrl={projectUrl} />
            </React.Suspense>
          </TooltipProvider>
        </ConnectorConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

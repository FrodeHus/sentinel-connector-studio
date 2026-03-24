import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import * as React from 'react'

import appCss from '../styles.css?url'
import { flushTelemetry, initTelemetry } from '@/lib/telemetry'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Sentinel Connector Studio",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    initTelemetry();
    return () => { flushTelemetry(); };
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return <Outlet />
}

function NotFoundComponent() {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground text-sm">Page not found.</p>
        <a href="/" className="text-sm text-primary hover:underline">Go home</a>
      </div>
    </div>
  )
}

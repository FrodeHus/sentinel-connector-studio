import * as React from "react"
import type { Driver } from "driver.js"
import type { TourDefinition, TourId } from "@/lib/tutorial/types"
import { createTourEngine, type NavigateToStepFn } from "@/lib/tutorial/tour-engine"
import { pushTour } from "@/lib/tutorial/push-tour"
import { pollerTour } from "@/lib/tutorial/poller-tour"

interface TutorialContextValue {
  isRunning: boolean
  startTour: (tourId: TourId) => void
  stopTour: () => void
  registerNavigator: (fn: NavigateToStepFn) => void
}

const TutorialContext = React.createContext<TutorialContextValue | null>(null)

const tours: Record<TourId, TourDefinition> = {
  push: pushTour,
  poller: pollerTour,
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = React.useState(false)
  const driverRef = React.useRef<Driver | null>(null)
  const navigatorRef = React.useRef<NavigateToStepFn | null>(null)

  const registerNavigator = React.useCallback((fn: NavigateToStepFn) => {
    navigatorRef.current = fn
  }, [])

  const stopTour = React.useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy()
      driverRef.current = null
    }
    setIsRunning(false)
  }, [])

  const startTour = React.useCallback(
    (tourId: TourId) => {
      // Stop any existing tour
      if (driverRef.current) {
        driverRef.current.destroy()
        driverRef.current = null
      }

      const tour = tours[tourId]
      if (!tour) return

      const navigate = navigatorRef.current
      if (!navigate) {
        console.warn("Tutorial navigator not registered. Is ConnectorWizard mounted?")
        return
      }

      // Navigate to the first stop before starting
      const firstStop = tour.stops[0]
      if (firstStop) {
        navigate(firstStop.mode, firstStop.stepId)
      }

      setIsRunning(true)

      // Wait for navigation to render before starting the driver
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const driverInstance = createTourEngine(tour, {
            navigateToStep: navigate,
            onDestroy: () => {
              driverRef.current = null
              setIsRunning(false)
            },
          })

          driverRef.current = driverInstance
          driverInstance.drive()
        })
      })
    },
    [],
  )

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy()
        driverRef.current = null
      }
    }
  }, [])

  const value = React.useMemo(
    () => ({ isRunning, startTour, stopTour, registerNavigator }),
    [isRunning, startTour, stopTour, registerNavigator],
  )

  return (
    <TutorialContext value={value}>
      {children}
    </TutorialContext>
  )
}

export function useTutorial(): TutorialContextValue {
  const ctx = React.useContext(TutorialContext)
  if (!ctx) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }
  return ctx
}

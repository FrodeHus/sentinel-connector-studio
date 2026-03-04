import { driver, type DriveStep, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import type { TourDefinition, TourStop } from "./types"
import { validateStopValue } from "./validation"

export type NavigateToStepFn = (
  mode: "connector" | "solution",
  stepId: string,
) => void

interface TourEngineCallbacks {
  navigateToStep: NavigateToStepFn
  onComplete: () => void
  onDestroy: () => void
}

function createCheckmarkElement(): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.classList.add("tutorial-checkmark")
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("width", "24")
  svg.setAttribute("height", "24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("stroke", "currentColor")
  svg.setAttribute("stroke-width", "3")
  svg.setAttribute("stroke-linecap", "round")
  svg.setAttribute("stroke-linejoin", "round")

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  path.classList.add("tutorial-checkmark-path")
  path.setAttribute("d", "M4 12l5 5L20 7")
  svg.appendChild(path)

  return svg as unknown as HTMLElement
}

let activeCleanup: (() => void) | null = null

function cleanupListener() {
  if (activeCleanup) {
    activeCleanup()
    activeCleanup = null
  }
}

function attachFieldListener(stop: TourStop) {
  cleanupListener()

  if (stop.expectedValue === null) return

  const el = document.querySelector(stop.elementSelector) as HTMLInputElement | HTMLTextAreaElement | null
  if (!el) return

  const updateValidation = () => {
    const valid = validateStopValue(stop, el.value)
    const footer = document.querySelector(".tutorial-custom-footer")
    if (!footer) return

    const badge = footer.querySelector(".tutorial-validation-badge") as HTMLElement | null
    const nextBtn = footer.querySelector(".driver-popover-next-btn") as HTMLElement | null

    if (badge) badge.style.display = valid ? "flex" : "none"
    if (nextBtn) nextBtn.style.display = valid ? "inline-flex" : "none"
  }

  // Check current value immediately
  updateValidation()

  el.addEventListener("input", updateValidation)
  activeCleanup = () => {
    el.removeEventListener("input", updateValidation)
  }
}

export function createTourEngine(
  tour: TourDefinition,
  callbacks: TourEngineCallbacks,
): Driver {
  const { navigateToStep, onComplete, onDestroy } = callbacks

  const steps: DriveStep[] = tour.stops.map((stop, stopIndex) => ({
    element: stop.elementSelector,
    popover: {
      title: stop.title,
      description: stop.description,
      side: stop.side ?? "bottom",
      showButtons: ["close"],
      onPopoverRender: (popover) => {
        const wrapper = popover.wrapper
        if (!wrapper) return

        const customFooter = document.createElement("div")
        customFooter.className = "tutorial-custom-footer"

        // Validation badge (hidden by default)
        const badge = document.createElement("span")
        badge.className = "tutorial-validation-badge"
        badge.appendChild(createCheckmarkElement())
        const label = document.createElement("span")
        label.textContent = "Correct!"
        badge.appendChild(label)
        badge.style.display = "none"
        customFooter.appendChild(badge)

        // Next button (hidden if validation needed)
        const nextBtn = document.createElement("button")
        nextBtn.className = "driver-popover-next-btn"
        nextBtn.textContent = stopIndex === tour.stops.length - 1 ? "Finish" : "Next"
        nextBtn.style.display = stop.expectedValue === null ? "inline-flex" : "none"
        nextBtn.addEventListener("click", () => {
          cleanupListener()
          if (stopIndex < tour.stops.length - 1) {
            driverInstance.moveTo(stopIndex + 1)
          } else {
            driverInstance.destroy()
          }
        })
        customFooter.appendChild(nextBtn)

        wrapper.appendChild(customFooter)

        // Attach field listener after a short delay so the DOM is ready
        // (onPopoverRender fires before animation completes)
        setTimeout(() => attachFieldListener(stop), 500)
      },
    },
  }))

  const driverInstance = driver({
    steps,
    animate: true,
    overlayColor: "rgba(0, 0, 0, 0.6)",
    stagePadding: 8,
    stageRadius: 12,
    allowClose: true,
    disableActiveInteraction: false,
    popoverClass: "tutorial-popover",
    onHighlightStarted: (_element, _step, { state }) => {
      cleanupListener()

      const stepIndex = state.activeIndex
      if (stepIndex === undefined) return

      const stop = tour.stops[stepIndex]
      if (!stop) return

      navigateToStep(stop.mode, stop.stepId)
    },
    onDestroyStarted: () => {
      cleanupListener()
      driverInstance.destroy()
    },
    onDestroyed: () => {
      onComplete()
      onDestroy()
    },
  })

  return driverInstance
}

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

function waitForFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count
    function tick() {
      remaining--
      if (remaining <= 0) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
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

function attachFieldListener(
  stop: TourStop,
  driverInstance: Driver,
) {
  // Clean up previous listener
  if (activeCleanup) {
    activeCleanup()
    activeCleanup = null
  }

  if (stop.expectedValue === null) return

  const el = document.querySelector(stop.elementSelector) as HTMLElement | null
  if (!el) return

  // For text input fields
  const inputEl = el as HTMLInputElement | HTMLTextAreaElement
  const handleInput = () => {
    const valid = validateStopValue(stop, inputEl.value)
    showValidation(driverInstance, valid)
  }

  // Check current value immediately
  handleInput()

  inputEl.addEventListener("input", handleInput)
  activeCleanup = () => {
    inputEl.removeEventListener("input", handleInput)
  }
}

function showValidation(_driverInstance: Driver, isValid: boolean) {
  const footer = document.querySelector(".tutorial-custom-footer")
  if (!footer) return

  const badge = footer.querySelector(".tutorial-validation-badge") as HTMLElement | null
  const nextBtn = footer.querySelector(".driver-popover-next-btn") as HTMLElement | null

  if (badge) {
    badge.style.display = isValid ? "flex" : "none"
  }
  if (nextBtn) {
    nextBtn.style.display = isValid ? "inline-flex" : "none"
  }
}

export function createTourEngine(
  tour: TourDefinition,
  callbacks: TourEngineCallbacks,
): Driver {
  const { navigateToStep, onComplete, onDestroy } = callbacks

  const steps: DriveStep[] = tour.stops.map((stop) => ({
    element: stop.elementSelector,
    popover: {
      title: stop.title,
      description: stop.description,
      side: stop.side ?? "bottom",
      showButtons: ["close"],
      onPopoverRender: (popover) => {
        // driver.js hides the built-in footer when showButtons has no
        // "next"/"previous", so we inject our own footer into the wrapper.
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
        nextBtn.textContent = "Next"
        nextBtn.style.display = stop.expectedValue === null ? "inline-flex" : "none"
        nextBtn.addEventListener("click", () => {
          const currentIndex = driverInstance.getActiveIndex()
          if (currentIndex === undefined) return
          driverInstance.moveTo(currentIndex + 1)
        })
        customFooter.appendChild(nextBtn)

        wrapper.appendChild(customFooter)
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
    onHighlightStarted: (_element, step) => {
      // Clean up previous listener
      if (activeCleanup) {
        activeCleanup()
        activeCleanup = null
      }

      const stepIndex = steps.indexOf(step)
      if (stepIndex < 0) return

      const stop = tour.stops[stepIndex]
      if (!stop) return

      // Navigate wizard to the correct step
      navigateToStep(stop.mode, stop.stepId)
    },
    onHighlighted: (_element, step) => {
      const stepIndex = steps.indexOf(step)
      if (stepIndex < 0) return

      const stop = tour.stops[stepIndex]
      if (!stop) return

      // Wait for React to render, then attach listener
      waitForFrames(2).then(() => {
        attachFieldListener(stop, driverInstance)
      })
    },
    onDestroyStarted: () => {
      if (activeCleanup) {
        activeCleanup()
        activeCleanup = null
      }
      driverInstance.destroy()
    },
    onDestroyed: () => {
      const isLast = driverInstance.getActiveIndex() === steps.length - 1
        || driverInstance.getActiveIndex() === undefined
      if (isLast) {
        onComplete()
      }
      onDestroy()
    },
  })

  return driverInstance
}

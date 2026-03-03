export interface TourStop {
  id: string
  elementSelector: string
  stepId: string
  mode: "connector" | "solution"
  title: string
  description: string
  expectedValue: string | null
  matchStrategy: "exact" | "startsWith" | "endsWith" | "contains"
  side?: "top" | "bottom" | "left" | "right"
}

export interface TourDefinition {
  id: string
  label: string
  description: string
  connectorKind: "Push" | "RestApiPoller"
  stops: TourStop[]
}

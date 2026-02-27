import { describe, it, expect } from "vitest"
import { generateWorkbookJson } from "../content-export"
import type { Workbook } from "../schemas"

describe("generateWorkbookJson", () => {
  const baseWorkbook: Workbook = {
    id: "wb-1",
    name: "Test Workbook",
    description: "A test workbook",
    fromTemplateId: "sentinel-test-workbook",
    serializedData: "",
    version: "1.0",
  }

  it("returns valid JSON with schema and templateId when serializedData is empty", () => {
    const result = generateWorkbookJson(baseWorkbook)
    const parsed = JSON.parse(result)
    expect(parsed.fromTemplateId).toBe("sentinel-test-workbook")
    expect(parsed.$schema).toContain("workbook.json")
    expect(parsed.version).toBe("1.0")
  })

  it("round-trips serializedData and preserves existing fields", () => {
    const galleryJson = JSON.stringify({
      $schema: "https://custom-schema",
      version: "Notebook/1.0",
      items: [{ type: 1 }, { type: 3 }],
      fromTemplateId: "sentinel-existing",
    })
    const wb: Workbook = { ...baseWorkbook, serializedData: galleryJson }
    const result = generateWorkbookJson(wb)
    const parsed = JSON.parse(result)

    expect(parsed.items).toHaveLength(2)
    expect(parsed.$schema).toBe("https://custom-schema")
    expect(parsed.fromTemplateId).toBe("sentinel-existing")
    expect(parsed.version).toBe("Notebook/1.0")
  })

  it("injects fromTemplateId when not present in serializedData", () => {
    const galleryJson = JSON.stringify({
      items: [{ type: 1 }],
    })
    const wb: Workbook = {
      ...baseWorkbook,
      fromTemplateId: "sentinel-injected",
      serializedData: galleryJson,
    }
    const result = generateWorkbookJson(wb)
    const parsed = JSON.parse(result)

    expect(parsed.fromTemplateId).toBe("sentinel-injected")
    expect(parsed.$schema).toContain("workbook.json")
  })

  it("handles invalid serializedData gracefully", () => {
    const wb: Workbook = { ...baseWorkbook, serializedData: "not json {{{" }
    const result = generateWorkbookJson(wb)
    const parsed = JSON.parse(result)

    expect(parsed.fromTemplateId).toBe("sentinel-test-workbook")
    expect(parsed.$schema).toContain("workbook.json")
  })
})

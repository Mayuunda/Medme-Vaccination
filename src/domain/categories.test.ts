import { describe, expect, it } from "vitest"
import { categoryCounts, summarize } from "./cohorts"
import { getSchoolCategory, recordErrors } from "./categories"
import { getMissingShots } from "./missingShots"
import { allIntervals, allRequirements } from "./rules.data"
import { generateRoster } from "./roster"
import type { Dose, Student } from "./types"

const today = "2026-09-08"
const dose = (vaccineId: string, date: string): Dose => ({ vaccineId, date, source: "registry" })
const dtap = ["2019-03-01", "2019-05-01", "2019-07-01", "2020-06-01", "2023-06-01"]
const polio = ["2019-03-01", "2019-05-01", "2020-06-01", "2023-06-01"]
const full = [...dtap.map((d) => dose("dtap", d)), ...polio.map((d) => dose("polio", d))]

function student(over: Partial<Student>): Student {
  return { id: "x", name: "Test Child", birthDate: "2018-12-01", grade: "K", school: "S", state: "OR", doses: full, hasRecord: true, ...over }
}
function category(s: Student) {
  return getSchoolCategory(s, getMissingShots(s, allRequirements, allIntervals, today))
}

describe("school categories", () => {
  it("complete when every dose is recorded", () => expect(category(student({}))).toBe("complete"))
  it("incomplete when a dose is overdue", () =>
    expect(category(student({ doses: full.slice(1) }))).toBe("incomplete"))
  it("no record when the family has nothing", () =>
    expect(category(student({ doses: [], hasRecord: false }))).toBe("no-record"))
  it("no rules on file for a state with no requirements", () =>
    expect(category(student({ state: "TX" }))).toBe("no-rules"))
  it("insufficient when a dose is dated before birth", () => {
    const s = student({ doses: [...full, dose("dtap", "2017-01-01")] })
    expect(recordErrors(s)[0]).toMatch(/before birth/)
    expect(category(s)).toBe("insufficient")
  })
  it("insufficient when the certificate is unsigned", () =>
    expect(category(student({ unsigned: true }))).toBe("insufficient"))
  it("exemption only changes the category when it covers what is missing", () => {
    const gap = full.slice(1)
    const covered = student({ doses: gap, exemption: { type: "nonmedical", vaccines: [], documentDate: "2026-08-01" } })
    expect(category(covered)).toBe("nonmedical-exemption")
    const wrongVaccine = student({ doses: gap, exemption: { type: "medical", vaccines: ["polio"], documentDate: "2026-08-01" } })
    expect(category(wrongVaccine)).toBe("incomplete")
  })
  it("a complete child with an exemption on file stays complete", () =>
    expect(category(student({ exemption: { type: "medical", vaccines: [], documentDate: "2026-08-01" } }))).toBe("complete"))
})

describe("category counts on the demo roster", () => {
  const roster = generateRoster(2026, 300, today)
  const counts = categoryCounts(summarize(roster, allRequirements, allIntervals, today))
  it("sum to the number of students", () =>
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(300))
  it("include exemptions and insufficient records", () => {
    expect(counts["nonmedical-exemption"]).toBeGreaterThan(0)
    expect(counts["medical-exemption"]).toBeGreaterThan(0)
    expect(counts.insufficient).toBeGreaterThan(0)
  })
  it("are the same for the same seed", () =>
    expect(categoryCounts(summarize(generateRoster(2026, 300, today), allRequirements, allIntervals, today))).toEqual(counts))
})

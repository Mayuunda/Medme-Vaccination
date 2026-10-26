import { describe, expect, it } from "vitest"
import { daysUntil, keyDatesFor, nextKeyDates } from "./keyDates"

describe("key dates", () => {
  it("lists upcoming Oregon dates soonest first", () => {
    const next = nextKeyDates("OR", "2026-10-26", 4)
    expect(next.map((d) => d.date)).toEqual(["2027-01-13", "2027-02-03", "2027-02-24", "2027-03-08"])
  })
  it("moves past dates out of the upcoming list", () => {
    const k = keyDatesFor("OR", "2027-02-10")
    expect(k.upcoming.map((d) => d.id)).toEqual(["or-exclusion-day", "or-report-dh"])
    expect(k.past.map((d) => d.id)).toContain("or-report-ab")
  })
  it("keeps rolling rules separate", () => {
    expect(keyDatesFor("NC", "2026-10-26").rolling[0].id).toBe("nc-30-day")
  })
  it("returns nothing for a state with no entries", () => {
    expect(nextKeyDates("TX", "2026-10-26", 3)).toEqual([])
  })
  it("counts days", () => {
    expect(daysUntil("2026-11-01", "2026-10-26")).toBe(6)
    expect(daysUntil("2026-10-20", "2026-10-26")).toBe(-6)
  })
})

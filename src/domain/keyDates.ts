import keyDates from "../data/keyDates.json"
import type { VerificationStatus } from "./types"

export type KeyDate = {
  id: string
  state: string
  label: string
  kind: "fixed-date" | "rolling"
  date?: string // YYYY-MM-DD, fixed-date only
  rule?: string // rolling only
  sourceUrl: string
  status: VerificationStatus
  lastReviewed: string
  note: string
}

export const allKeyDates = keyDates as KeyDate[]

/** Key dates for a state, soonest first. Rolling rules come last. The date is passed in. */
export function keyDatesFor(state: string, today: string, dates: KeyDate[] = allKeyDates) {
  const mine = dates.filter((d) => d.state === state)
  const upcoming = mine.filter((d) => d.kind === "fixed-date" && (d.date ?? "") >= today).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
  const rolling = mine.filter((d) => d.kind === "rolling")
  return { upcoming, rolling, past: mine.filter((d) => d.kind === "fixed-date" && (d.date ?? "") < today) }
}

export function nextKeyDates(state: string, today: string, count: number, dates: KeyDate[] = allKeyDates) {
  return keyDatesFor(state, today, dates).upcoming.slice(0, count)
}

/** Whole days from today to a fixed date, negative when past. */
export function daysUntil(date: string, today: string) {
  return Math.round((Date.parse(date) - Date.parse(today)) / 86400000)
}

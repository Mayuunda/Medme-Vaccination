import { getChildStatus, getMissingShots } from "./missingShots"
import { categoryOrder, getSchoolCategory } from "./categories"
import type { ChildStatus, Interval, Requirement, SchoolCategory, Student, VaccineResult } from "./types"

export type StudentSummary = {
  student: Student
  status: ChildStatus
  category: SchoolCategory
  results: VaccineResult[]
  /** vaccine ids that are missing doses */
  missing: string[]
}

export function summarize(
  roster: Student[],
  requirements: Requirement[],
  intervals: Interval[],
  today: string,
): StudentSummary[] {
  return roster.map((student) => {
    const results = getMissingShots(student, requirements, intervals, today)
    return {
      student,
      status: getChildStatus(results),
      category: getSchoolCategory(student, results),
      results,
      missing: results.filter((r) => r.status === "missing").map((r) => r.vaccineId),
    }
  })
}

export function cohortCounts(summaries: StudentSummary[]) {
  const count = (s: ChildStatus) => summaries.filter((x) => x.status === s).length
  return {
    total: summaries.length,
    upToDate: count("up-to-date"),
    missing: count("missing"),
    unknown: count("unknown"),
  }
}

/** Students per school category, in report order. Always sums to the number of students. */
export function categoryCounts(summaries: StudentSummary[]): Record<SchoolCategory, number> {
  const out = Object.fromEntries(categoryOrder.map((c) => [c, 0])) as Record<SchoolCategory, number>
  for (const s of summaries) out[s.category] += 1
  return out
}

/** Coverage per vaccine for a group: students with that vaccine complete, of those with a requirement for it. */
export function coverageBy(
  summaries: StudentSummary[],
  key: (s: Student) => string,
  vaccineIds: string[],
) {
  const groups = new Map<string, StudentSummary[]>()
  for (const s of summaries) {
    const k = key(s.student)
    groups.set(k, [...(groups.get(k) ?? []), s])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([group, members]) => ({
      group,
      size: members.length,
      byVaccine: Object.fromEntries(
        vaccineIds.map((id) => {
          const withReq = members.filter((m) => m.results.some((r) => r.vaccineId === id))
          const done = withReq.filter((m) =>
            m.results.some((r) => r.vaccineId === id && r.status === "complete"),
          ).length
          return [id, { done, of: withReq.length }]
        }),
      ),
    }))
}

export type Queue = { id: string; label: string; hint: string; members: StudentSummary[] }

/** Work queues for the administrator. A student can be in more than one queue. */
export function buildQueues(summaries: StudentSummary[]): Queue[] {
  return [
    { id: "needs-visit", label: "Missing doses, no visit booked", hint: "Most urgent: documented gap and nothing scheduled", members: summaries.filter((s) => s.status === "missing" && !s.student.visitDate) },
    { id: "booked", label: "Visit booked", hint: "Missing doses with an appointment on the calendar", members: summaries.filter((s) => s.status === "missing" && !!s.student.visitDate) },
    { id: "no-record", label: "Unknown", hint: "No record found, or no rules on file for the state", members: summaries.filter((s) => s.status === "unknown") },
  ]
}

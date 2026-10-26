import type { Exemption, SchoolCategory, Student, VaccineResult } from "./types"

export const categoryLabels: Record<SchoolCategory, string> = {
  complete: "Complete",
  "in-process": "In process",
  incomplete: "Incomplete",
  insufficient: "Insufficient",
  "nonmedical-exemption": "Nonmedical exemption",
  "medical-exemption": "Medical exemption",
  "no-record": "No record",
  "no-rules": "No rules on file",
}

/** Categories where the school has to send the family a notice. */
export const needsNotice: SchoolCategory[] = ["incomplete", "insufficient", "no-record"]

/** Display order, matching how school reports list them. */
export const categoryOrder: SchoolCategory[] = [
  "complete",
  "in-process",
  "incomplete",
  "insufficient",
  "nonmedical-exemption",
  "medical-exemption",
  "no-record",
  "no-rules",
]

/**
 * Record problems a school counts as "insufficient": a dose dated before birth,
 * the same vaccine given twice on one date, or a certificate nobody signed.
 */
export function recordErrors(student: Student): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const d of student.doses) {
    if (!d.date) errors.push(`A ${d.vaccineId} dose has no date`)
    else if (d.date < student.birthDate) errors.push(`A ${d.vaccineId} dose is dated before birth`)
    const key = `${d.vaccineId}|${d.date}`
    if (seen.has(key)) errors.push(`Two ${d.vaccineId} doses share the date ${d.date}`)
    seen.add(key)
  }
  if (student.unsigned) errors.push("The certificate has no parent signature")
  return errors
}

function covers(ex: Exemption, vaccineId: string) {
  return ex.vaccines.length === 0 || ex.vaccines.includes(vaccineId)
}

/**
 * One category per student. Pure function; the date is passed in through the vaccine results.
 * Order matters: no rules and no record come first, then record errors, then exemptions,
 * then the dose count.
 */
export function getSchoolCategory(student: Student, results: VaccineResult[]): SchoolCategory {
  if (results.length === 0) return "no-rules"
  if (student.hasRecord === false && student.doses.length === 0 && !student.exemption) return "no-record"
  if (recordErrors(student).length > 0) return "insufficient"
  const overdue = results.filter((r) => r.status === "missing")
  const ex = student.exemption
  if (ex && overdue.length > 0 && overdue.every((r) => covers(ex, r.vaccineId)))
    return ex.type === "medical" ? "medical-exemption" : "nonmedical-exemption"
  if (overdue.length > 0) return "incomplete"
  if (results.some((r) => r.status === "not-yet-due")) return "in-process"
  return "complete"
}

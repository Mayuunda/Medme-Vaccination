export type VerificationStatus =
  | "read-on-official-page"
  | "unverified"
  | "not-researched"

export type VaccineId = string

export type Dose = {
  vaccineId: VaccineId
  date: string // YYYY-MM-DD
  source: "registry" | "parent" | "pharmacy"
  lot?: string
  signedBy?: string
}

export type Exemption = {
  type: "medical" | "nonmedical"
  /** vaccines the exemption covers; empty means all required vaccines */
  vaccines: VaccineId[]
  /** date the exemption document was received (YYYY-MM-DD) */
  documentDate: string
}

export type Student = {
  id: string
  name: string
  birthDate: string // YYYY-MM-DD
  grade: string
  school: string
  state: string // two-letter code
  doses: Dose[]
  /** false when no record could be found at all (distinct from a record with zero doses) */
  hasRecord?: boolean
  exemption?: Exemption
  /** true when the family's certificate has no parent signature (a record error schools call insufficient) */
  unsigned?: boolean
  /** DEMO-FAKE: a booked visit date for students who already scheduled */
  visitDate?: string
}

export type Requirement = {
  state: string
  grade: string // "K", "1", ... or "*" for any grade
  vaccineId: VaccineId
  dosesRequired: number
  sourceUrl: string
  status: VerificationStatus
}

export type Interval = {
  vaccineId: VaccineId
  minDaysBetweenDoses: number
  status: "SAMPLE" | VerificationStatus
}

export type VaccinationStatus =
  | "complete"
  | "missing"
  | "not-yet-due"
  | "unknown"

export type VaccineResult = {
  vaccineId: VaccineId
  status: VaccinationStatus
  dosesRequired: number
  dosesRecorded: number
  dosesMissing: number
  earliestDate?: string // set when status is not-yet-due or missing and an interval exists
  sourceUrl: string
  verification: VerificationStatus | "SAMPLE"
}

/**
 * The categories schools sort students into (Oregon's list), plus two of ours:
 * "in-process" (only doses not yet due remain, counts as good standing) and
 * "no-rules" (no rules on file for the state, never counted as incomplete).
 */
export type SchoolCategory =
  | "complete"
  | "in-process"
  | "incomplete"
  | "insufficient"
  | "nonmedical-exemption"
  | "medical-exemption"
  | "no-record"
  | "no-rules"

export type ChildStatus = "up-to-date" | "missing" | "unknown"

export type StateRule = {
  state: string // two-letter code
  status: VerificationStatus
  sourceUrl: string
  lastReviewed: string // YYYY-MM-DD or ""
  /** Youngest age a pharmacist may vaccinate without a prescription. null = not allowed or unknown. */
  minAgeNoRx: number | null
  /** Youngest age with a prescription. null = unknown. */
  minAgeWithRx: number | null
  /** Vaccines allowed without a prescription. */
  vaccinesNoRx: "all-acip" | VaccineId[] | "unknown"
  /** Extra vaccines allowed below minAgeNoRx (for example flu and COVID from age 7). */
  exceptionsNoRx?: { vaccines: VaccineId[]; minAge: number }
  /** Pharmacist needs a signed agreement with a physician or health department. */
  requiresAgreement: boolean
  /** Written parental consent needed below this age (null = not stated). */
  writtenConsentUnderAge: number | null
  notes: string
}

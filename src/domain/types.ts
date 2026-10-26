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
  /** Who the state allows to sign the school immunization certificate (empty when not read). */
  whoMaySign?: string[]
  /** Whether a pharmacy-signed record is accepted as the school record in this state. */
  acceptsPharmacyRecord?: "yes" | "no" | "unknown"
}

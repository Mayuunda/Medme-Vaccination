import { Button, Card, Heading } from "../../components/ui"
import { complianceReportPdf, studentsCsv } from "../../demo/adminDocs"
import { downloadBlob } from "../../demo/documents"
import type { StudentSummary } from "../../domain/cohorts"
import { useDemo } from "../../state"
import Appointments from "./Appointments"
import Categories from "./Categories"
import Tracker from "./Tracker"

export default function Reports({ campaign, summaries }: { campaign: string; summaries: StudentSummary[] }) {
  const { data } = useDemo()
  const generated = data.appointments.filter((a) => a.campaign === campaign && !a.seeded)
  const funnel: [string, number, string][] = [
    ["Scans", data.events.filter((e) => e.type === "scan").length, "Parents who opened the school notice code. Simulated."],
    ["Profiles created", data.childSaved ? 1 : 0, "Child profiles saved during this demo session."],
    ["Bookings", generated.length, "Every booking made, including cancelled ones."],
    ["Completed appointments", generated.filter((a) => a.doses.length === a.vaccines.length).length, "All selected doses saved."],
    ["Reported doses", generated.reduce((n, a) => n + a.doses.filter((d) => d.reported).length, 0), "Doses acknowledged by the simulated reporting service."],
  ]
  return (
    <>
      <Card>
        <div className="section-heading">
          <div>
            <Heading level={2}>Downloads</Heading>
            <p className="muted">Demo documents. Each page is marked as fictional data, not a legal record.</p>
          </div>
        </div>
        <div className="action-row">
          <Button variant="secondary" onClick={() => downloadBlob(complianceReportPdf(summaries, "All students"), "compliance-report-all-demo.pdf")}>Compliance report, all students (PDF)</Button>
          <Button variant="secondary" onClick={() => downloadBlob(complianceReportPdf(summaries.filter((s) => s.status === "missing"), "Students missing doses"), "compliance-report-missing-demo.pdf")}>Students missing doses (PDF)</Button>
          <Button variant="secondary" onClick={() => downloadBlob(studentsCsv(summaries), "all-students-demo.csv")}>All students (CSV)</Button>
        </div>
        <p className="inline-note">Student records are downloaded from each student's profile.</p>
      </Card>
      <div style={{ marginTop: "var(--space-5)" }}><Categories summaries={summaries} /></div>
      <div style={{ marginTop: "var(--space-5)" }}><Tracker summaries={summaries} /></div>
      <Card style={{ marginTop: "var(--space-5)" }}>
        <details>
          <summary><strong>Parent activity (demo funnel)</strong> <span className="muted">Scans, profiles, bookings, completed visits, reported doses</span></summary>
          <div className="table-scroll" style={{ marginTop: "var(--space-4)" }}>
            <table>
              <thead><tr><th>Step</th><th>Count</th><th>What it counts</th></tr></thead>
              <tbody>
                {funnel.map(([label, value, detail]) => (
                  <tr key={label}><td><strong>{label}</strong></td><td>{campaign === "fall" ? value : 0}</td><td className="muted">{detail}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>
      <div style={{ marginTop: "var(--space-5)" }}><Appointments campaign={campaign} /></div>
    </>
  )
}

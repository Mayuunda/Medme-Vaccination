import { categoryLabels, categoryOrder } from "../../domain/categories"
import type { SchoolCategory } from "../../domain/types"
import { useMemo, useState } from "react"
import { Badge, Button, Card, Field, Heading, Icon, Select, StatusBadge } from "../../components/ui"
import { complianceReportPdf, studentRecordPdf, studentsCsv } from "../../demo/adminDocs"
import { downloadBlob } from "../../demo/documents"
import { buildQueues } from "../../domain/cohorts"
import type { StudentSummary } from "../../domain/cohorts"
import { rosterGrades, rosterSchools } from "../../domain/roster"
import { vaccineName } from "../../data/vaccines"
import { stateName } from "../../data/states"
import { dateLabel } from "../../demo/journey"
import { useDemo } from "../../state"

export type StudentFilter = { q: string; school: string; grade: string; status: string; category: string; missing: string; queue: string }
export const emptyFilter: StudentFilter = { q: "", school: "", grade: "", status: "", category: "", missing: "", queue: "" }
const views = [
  { id: "", label: "All students" },
  { id: "needs-visit", label: "Missing doses, no visit" },
  { id: "booked", label: "Visit booked" },
  { id: "no-record", label: "Unknown" },
]
const rank = (s: StudentSummary) => (s.status === "missing" ? (s.student.visitDate ? 1 : 0) : s.status === "unknown" ? 2 : 3)
const PAGE = 25

export function StudentDirectory({
  summaries,
  filter,
  setFilter,
  onOpen,
  selected,
  setSelected,
  onContact,
}: {
  summaries: StudentSummary[]
  filter: StudentFilter
  setFilter: (f: StudentFilter) => void
  onOpen: (id: string) => void
  selected: string[]
  setSelected: (ids: string[]) => void
  onContact: () => void
}) {
  const [more, setMore] = useState(false)
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState("urgency")
  const [compact, setCompact] = useState(false)
  const set = (patch: Partial<StudentFilter>) => {
    setFilter({ ...filter, ...patch })
    setPage(0)
  }
  const rows = useMemo(() => {
    const q = filter.q.trim().toLowerCase()
    const inQueue = filter.queue ? new Set(buildQueues(summaries).find((x) => x.id === filter.queue)?.members.map((m) => m.student.id)) : null
    const out = summaries.filter(
      (s) =>
        (!inQueue || inQueue.has(s.student.id)) &&
        (!q || s.student.name.toLowerCase().includes(q) || s.student.id.includes(q)) &&
        (!filter.school || s.student.school === filter.school) &&
        (!filter.grade || s.student.grade === filter.grade) &&
        (!filter.status || s.status === filter.status) &&
        (!filter.category || s.category === filter.category) &&
        (!filter.missing || s.missing.includes(filter.missing)),
    )
    const order = (a: StudentSummary, b: StudentSummary) =>
      sort === "urgency"
        ? rank(a) - rank(b) || b.missing.length - a.missing.length || a.student.name.localeCompare(b.student.name)
        : sort === "grade"
        ? rosterGrades.indexOf(a.student.grade) - rosterGrades.indexOf(b.student.grade) || a.student.name.localeCompare(b.student.name)
        : sort === "school"
          ? a.student.school.localeCompare(b.student.school) || a.student.name.localeCompare(b.student.name)
          : sort === "status"
            ? a.status.localeCompare(b.status) || a.student.name.localeCompare(b.student.name)
            : a.student.name.localeCompare(b.student.name)
    return out.sort(order)
  }, [summaries, filter, sort])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = Math.min(page, pages - 1)
  const shown = rows.slice(current * PAGE, current * PAGE + PAGE)
  return (
    <Card>
      <div className="section-heading">
        <div>
          <Heading level={2}>Students</Heading>
          <p className="muted">Search and filter every fictional student. Open a row for the full profile.</p>
        </div>
        <Icon name="user" size={18} />
      </div>
      <div className="chips" role="group" aria-label="Views">
        {views.map((v) => (
          <button key={v.id} className="chip" aria-pressed={filter.queue === v.id} onClick={() => set({ queue: v.id, status: "" })}>{v.label}</button>
        ))}
      </div>
      <div className="filter-bar">
        <Field label="Search by name or ID" value={filter.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search a name" />
        <Select label="School" value={filter.school} onChange={(e) => set({ school: e.target.value })}>
          <option value="">All schools</option>
          {rosterSchools.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select label="Grade" value={filter.grade} onChange={(e) => set({ grade: e.target.value })}>
          <option value="">All grades</option>
          {rosterGrades.map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </Select>
        <Button variant="text" onClick={() => setMore(!more)} aria-expanded={more}>{more ? "Fewer filters" : "More filters"}</Button>
      </div>
      {more && (
        <div className="filter-bar" style={{ marginTop: "var(--space-3)" }}>
          <Select label="Vaccination status" value={filter.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">Any status</option>
            <option value="up-to-date">Up to date</option>
            <option value="missing">Missing doses</option>
            <option value="unknown">Unknown</option>
          </Select>
          <Select label="School category" value={filter.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">Any category</option>
            {categoryOrder.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
          </Select>
          <Select label="Missing vaccine" value={filter.missing} onChange={(e) => set({ missing: e.target.value })}>
            <option value="">Any</option>
            <option value="dtap">DTaP</option>
            <option value="polio">IPV</option>
          </Select>
        </div>
      )}
      {selected.length > 0 && (
        <div className="selection-bar">
          <strong>{selected.length} selected</strong>
          <Button variant="secondary" onClick={onContact}>Contact families</Button>
          <Button variant="secondary" onClick={() => downloadBlob(studentsCsv(summaries.filter((x) => selected.includes(x.student.id))), "selected-students-demo.csv")}>Download list (CSV)</Button>
          <Button variant="text" onClick={() => setSelected([])}>Clear selection</Button>
        </div>
      )}
      <div className="directory-bar">
        <span aria-live="polite"><strong>{rows.length}</strong> of {summaries.length} students</span>
        <span className="action-row" style={{ margin: 0 }}>
          <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="urgency">Most urgent first</option>
            <option value="name">Name</option>
            <option value="grade">Grade</option>
            <option value="school">School</option>
            <option value="status">Status</option>
          </Select>
          <Button variant="secondary" onClick={() => setCompact(!compact)}>{compact ? "Comfortable rows" : "Compact rows"}</Button>
          <Button variant="secondary" onClick={() => downloadBlob(studentsCsv(rows), "students-demo.csv")}>CSV</Button>
          <Button variant="secondary" onClick={() => downloadBlob(complianceReportPdf(rows, scopeText(filter)), "compliance-report-demo.pdf")}>Report (PDF)</Button>
          <Button variant="text" onClick={() => { setFilter(emptyFilter); setPage(0) }}>Clear filters</Button>
        </span>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state"><p>No student matches these filters.</p></div>
      ) : (
        <div className="table-scroll">
          <table className={`directory ${compact ? "compact" : ""}`}>
            <thead><tr><th><input type="checkbox" aria-label="Select all on this page" checked={shown.length > 0 && shown.every((x) => selected.includes(x.student.id))} onChange={(e) => setSelected(e.target.checked ? [...new Set([...selected, ...shown.map((x) => x.student.id)])] : selected.filter((id) => !shown.some((x) => x.student.id === id)))} /></th><th>Student</th><th>School</th><th>Grade</th><th>State</th><th>Status</th><th>Missing</th></tr></thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.student.id} className="row-link" onClick={() => onOpen(s.student.id)}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`Select ${s.student.name}`} checked={selected.includes(s.student.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, s.student.id] : selected.filter((id) => id !== s.student.id))} />
                  </td>
                  <td>
                    <div className="name-cell">
                      <span className="avatar">{s.student.name[0]}</span>
                      <button onClick={(e) => { e.stopPropagation(); onOpen(s.student.id) }}>{s.student.name}</button>
                    </div>
                  </td>
                  <td>{s.student.school}</td>
                  <td>{s.student.grade}</td>
                  <td>{s.student.state}</td>
                  <td><StatusBadge status={s.status} />{s.student.visitDate && <Badge>Visit {dateLabel(s.student.visitDate)}</Badge>}</td>
                  <td>{s.missing.length ? s.missing.map(vaccineName).join(", ") : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pager">
        <span>Page {current + 1} of {pages}</span>
        <span className="action-row" style={{ margin: 0 }}>
          <Button variant="secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</Button>
          <Button variant="secondary" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</Button>
        </span>
      </div>
    </Card>
  )
}

function scopeText(f: StudentFilter) {
  const parts = [f.queue && views.find((v) => v.id === f.queue)?.label, f.school, f.grade && `Grade ${f.grade}`, f.status, f.category && categoryLabels[f.category as SchoolCategory], f.q && `search "${f.q}"`].filter(Boolean)
  return parts.length ? parts.join(", ") : "All students"
}

export function StudentProfile({ summary, onBack }: { summary?: StudentSummary; onBack: () => void }) {
  const { data } = useDemo()
  if (!summary)
    return (
      <Card>
        <p>No student with that ID.</p>
        <Button variant="secondary" onClick={onBack}>Back to students</Button>
      </Card>
    )
  const { student: s } = summary
  const history = [...s.doses].sort((a, b) => b.date.localeCompare(a.date))
  const visits = data.appointments.filter((a) => a.child.name === s.name)
  return (
    <>
      <Button variant="text" onClick={onBack}><Icon name="back" size={17} /> Back to students</Button>
      <div className="profile-head">
        <span className="avatar">{s.name[0]}</span>
        <div>
          <Heading>{s.name}</Heading>
          <p>{s.school} · Grade {s.grade} · {stateName(s.state)} · Born {dateLabel(s.birthDate)} · ID {s.id}</p>
        </div>
        <StatusBadge status={summary.status} />
        <Badge>{categoryLabels[summary.category]}</Badge>
        <Button variant="secondary" onClick={() => downloadBlob(studentRecordPdf(summary), `${s.id}-immunization-record-demo.pdf`)}><Icon name="document" size={17} /> Download record (PDF)</Button>
      </div>
      <div className="profile-grid">
        <Card>
          <Heading level={2}>Required vaccines</Heading>
          <p className="muted">Compared with the school's list. Nothing here is a recommendation.</p>
          {summary.results.length === 0 ? (
            <p className="muted">No requirements on file for {stateName(s.state)}. Check with the state health department.</p>
          ) : (
            summary.results.map((r) => (
              <div className="vaccine-line" key={r.vaccineId}>
                <strong>{vaccineName(r.vaccineId)}</strong>
                <span>
                  {r.dosesRecorded} of {r.dosesRequired} doses
                  <small>
                    {r.verification === "unverified" || r.verification === "SAMPLE" ? "Requirement not verified against an official source" : "Source on file"}
                    {r.earliestDate && r.status === "not-yet-due" ? ` · Earliest next dose ${dateLabel(r.earliestDate)} (sample interval)` : ""}
                  </small>
                </span>
                <StatusBadge status={r.status} />
              </div>
            ))
          )}
        </Card>
        <Card>
          <Heading level={2}>Vaccination history</Heading>
          <p className="muted">Recorded doses from all sources.</p>
          {s.hasRecord === false ? (
            <p className="muted">No record found. Status is unknown, not missing.</p>
          ) : history.length === 0 ? (
            <p className="muted">The record exists and lists no doses.</p>
          ) : (
            <ul className="timeline">
              {history.map((d, i) => (
                <li key={i}><time>{dateLabel(d.date)}</time><span>{vaccineName(d.vaccineId)} <Badge>{d.source}</Badge></span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card>
        <Heading level={2}>Appointments</Heading>
        {visits.length === 0 ? (
          <p className="muted">No demo booking for this student.</p>
        ) : (
          <ul className="timeline">
            {visits.map((a) => (
              <li key={a.id}><time>{dateLabel(a.date)}</time><span>{a.id} · {a.doses.length} of {a.vaccines.length} doses saved</span></li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

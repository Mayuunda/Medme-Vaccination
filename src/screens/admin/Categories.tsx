import { Card, Heading } from "../../components/ui"
import { categoryLabels, categoryOrder, needsNotice } from "../../domain/categories"
import type { StudentSummary } from "../../domain/cohorts"
import { rosterGrades } from "../../domain/roster"

/** Students by school category and grade: the table a school's state report is built from. */
export default function Categories({ summaries }: { summaries: StudentSummary[] }) {
  const grades = rosterGrades.filter((g) => summaries.some((s) => s.student.grade === g))
  const count = (cat: string, grade?: string) =>
    summaries.filter((s) => s.category === cat && (!grade || s.student.grade === grade)).length
  const total = summaries.length
  return (
    <Card>
      <div className="section-heading">
        <div>
          <Heading level={2}>Students by category</Heading>
          <p className="muted">Each student is in exactly one row. Rows marked "notice" need a letter to the family.</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              {grades.map((g) => <th key={g}>Grade {g}</th>)}
              <th>Total</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {categoryOrder.map((cat) => (
              <tr key={cat}>
                <td><strong>{categoryLabels[cat]}</strong>{(needsNotice as string[]).includes(cat) && <span className="muted"> · notice</span>}</td>
                {grades.map((g) => <td key={g}>{count(cat, g)}</td>)}
                <td>{count(cat)}</td>
                <td>{total ? Math.round((count(cat) / total) * 100) : 0}%</td>
              </tr>
            ))}
            <tr>
              <td><strong>All students</strong></td>
              {grades.map((g) => <td key={g}><strong>{summaries.filter((s) => s.student.grade === g).length}</strong></td>)}
              <td><strong>{total}</strong></td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="inline-note">"In process" means only doses that are not yet due remain. "No rules on file" is shown on its own and never counted as incomplete.</p>
    </Card>
  )
}

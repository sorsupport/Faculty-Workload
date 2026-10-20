import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { Term } from "../types";

const SEMESTERS = [
  { value: "1", label: "1st Semester" },
  { value: "2", label: "2nd Semester" },
] as const;

function defaultDates(year: number, semester: string) {
  if (semester === "1") {
    return { startDate: `${year}-08-01`, endDate: `${year}-12-20` };
  }
  return { startDate: `${year + 1}-01-05`, endDate: `${year + 1}-05-31` };
}

function semesterLabel(semester: string) {
  return SEMESTERS.find((s) => s.value === semester)?.label ?? "";
}

export function TermsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [terms, setTerms] = useState<Term[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    year: currentYear,
    semester: "1",
    ...defaultDates(currentYear, "1"),
  });

  async function load() {
    setTerms(await api.get<Term[]>("/terms"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function updateYearOrSemester(year: number, semester: string) {
    setForm({ year, semester, ...defaultDates(year, semester) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/terms", {
        name: `${form.year} - ${semesterLabel(form.semester)}`,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setShowForm(false);
      updateYearOrSemester(currentYear, "1");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this term? Its sections and assignments will also be removed.")) return;
    try {
      await api.del(`/terms/${id}`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Terms</h2>
        {isAdmin && (
          <button className="primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add Term"}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && isAdmin && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Year
              <input
                required
                type="number"
                value={form.year}
                onChange={(e) => updateYearOrSemester(Number(e.target.value), form.semester)}
              />
            </label>
            <label>
              Semester
              <select
                value={form.semester}
                onChange={(e) => updateYearOrSemester(form.year, e.target.value)}
              >
                {SEMESTERS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label>
              Start Date
              <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </label>
            <label>
              End Date
              <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </label>
          </div>
          <button className="primary" type="submit">Save Term</button>
        </form>
      )}

      {terms.length === 0 ? (
        <p className="empty-state">No terms yet. Add one to get started.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{new Date(t.startDate).toLocaleDateString()}</td>
                <td>{new Date(t.endDate).toLocaleDateString()}</td>
                {isAdmin && (
                  <td>
                    <button className="danger" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

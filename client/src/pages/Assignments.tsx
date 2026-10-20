import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { Assignment, Faculty, Section, Term } from "../types";
import { TermSelect } from "../components/TermSelect";

export function AssignmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [terms, setTerms] = useState<Term[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ facultyId: "", sectionId: "", role: "primary", loadHours: "" });

  useEffect(() => {
    Promise.all([api.get<Term[]>("/terms"), api.get<Faculty[]>("/faculty")])
      .then(([t, f]) => {
        setTerms(t);
        setFaculty(f);
        if (t.length > 0) setSelectedTermId(t[0].id);
        if (f.length > 0) setForm((prev) => ({ ...prev, facultyId: String(f[0].id) }));
      })
      .catch((e) => setError(e.message));
  }, []);

  async function loadForTerm(termId: number) {
    const [sec, asn] = await Promise.all([
      api.get<Section[]>(`/sections?termId=${termId}`),
      api.get<Assignment[]>(`/assignments?termId=${termId}`),
    ]);
    setSections(sec);
    setAssignments(asn);
    if (sec.length > 0) setForm((prev) => ({ ...prev, sectionId: String(sec[0].id) }));
  }

  useEffect(() => {
    if (selectedTermId) loadForTerm(selectedTermId).catch((e) => setError(e.message));
  }, [selectedTermId]);

  function sectionDefaultLoad(sectionId: string) {
    const section = sections.find((s) => String(s.id) === sectionId);
    return section ? String(section.course.creditHours) : "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/assignments", {
        facultyId: Number(form.facultyId),
        sectionId: Number(form.sectionId),
        role: form.role,
        loadHours: Number(form.loadHours || sectionDefaultLoad(form.sectionId)),
      });
      setShowForm(false);
      setForm({ ...form, loadHours: "" });
      if (selectedTermId) await loadForTerm(selectedTermId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this assignment?")) return;
    try {
      await api.del(`/assignments/${id}`);
      if (selectedTermId) await loadForTerm(selectedTermId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const canAssign = faculty.length > 0 && sections.length > 0;

  return (
    <div>
      <div className="page-header">
        <h2>Assignments</h2>
        {isAdmin && (
          <button className="primary" onClick={() => setShowForm((s) => !s)} disabled={!canAssign}>
            {showForm ? "Cancel" : "+ Assign Faculty to Section"}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <TermSelect terms={terms} value={selectedTermId} onChange={setSelectedTermId} />

      {isAdmin && !canAssign && <p className="empty-state">Add faculty and sections for this term before assigning.</p>}

      {showForm && isAdmin && canAssign && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Faculty
              <select value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })}>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>
            <label>
              Section
              <select
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value, loadHours: "" })}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.course.code} §{s.sectionNumber}</option>
                ))}
              </select>
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="primary">primary</option>
                <option value="co-instructor">co-instructor</option>
              </select>
            </label>
            <label>
              Load Hours (defaults to course credit hours)
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder={sectionDefaultLoad(form.sectionId)}
                value={form.loadHours}
                onChange={(e) => setForm({ ...form, loadHours: e.target.value })}
              />
            </label>
          </div>
          <button className="primary" type="submit">Save Assignment</button>
        </form>
      )}

      {assignments.length === 0 ? (
        <p className="empty-state">No assignments for this term yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Course</th>
              <th>Section</th>
              <th>Role</th>
              <th>Load Hours</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.faculty?.name}</td>
                <td>{a.section?.course.code} — {a.section?.course.title}</td>
                <td>{a.section?.sectionNumber}</td>
                <td>{a.role}</td>
                <td>{a.loadHours}</td>
                {isAdmin && (
                  <td>
                    <button className="danger" onClick={() => handleDelete(a.id)}>Remove</button>
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

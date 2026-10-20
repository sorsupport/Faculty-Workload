import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { Course, Section, Term } from "../types";
import { TermSelect } from "../components/TermSelect";

export function SectionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ sectionNumber: "001", courseId: "", capacity: "" });

  useEffect(() => {
    Promise.all([api.get<Term[]>("/terms"), api.get<Course[]>("/courses")])
      .then(([t, c]) => {
        setTerms(t);
        setCourses(c);
        if (t.length > 0) setSelectedTermId(t[0].id);
        if (c.length > 0) setForm((f) => ({ ...f, courseId: String(c[0].id) }));
      })
      .catch((e) => setError(e.message));
  }, []);

  async function loadSections(termId: number) {
    setSections(await api.get<Section[]>(`/sections?termId=${termId}`));
  }

  useEffect(() => {
    if (selectedTermId) loadSections(selectedTermId).catch((e) => setError(e.message));
  }, [selectedTermId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTermId) return;
    setError(null);
    try {
      await api.post("/sections", {
        sectionNumber: form.sectionNumber,
        courseId: Number(form.courseId),
        termId: selectedTermId,
        capacity: form.capacity ? Number(form.capacity) : null,
      });
      setForm({ ...form, sectionNumber: "001", capacity: "" });
      setShowForm(false);
      await loadSections(selectedTermId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this section? Any assignments to it will also be removed.")) return;
    try {
      await api.del(`/sections/${id}`);
      if (selectedTermId) await loadSections(selectedTermId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Sections</h2>
        {isAdmin && (
          <button className="primary" onClick={() => setShowForm((s) => !s)} disabled={!selectedTermId || courses.length === 0}>
            {showForm ? "Cancel" : "+ Add Section"}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <TermSelect terms={terms} value={selectedTermId} onChange={setSelectedTermId} />

      {courses.length === 0 && <p className="empty-state">Add a course first before creating sections.</p>}

      {showForm && isAdmin && selectedTermId && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Course
              <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                ))}
              </select>
            </label>
            <label>
              Section Number
              <input required value={form.sectionNumber} onChange={(e) => setForm({ ...form, sectionNumber: e.target.value })} />
            </label>
            <label>
              Capacity (optional)
              <input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </label>
          </div>
          <button className="primary" type="submit">Save Section</button>
        </form>
      )}

      {sections.length === 0 ? (
        <p className="empty-state">No sections for this term yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Section</th>
              <th>Capacity</th>
              <th>Assigned Faculty</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id}>
                <td>{s.course.code} — {s.course.title}</td>
                <td>{s.sectionNumber}</td>
                <td>{s.capacity ?? "—"}</td>
                <td>
                  {s.assignments.length === 0
                    ? "Unassigned"
                    : s.assignments.map((a) => a.faculty?.name).join(", ")}
                </td>
                {isAdmin && (
                  <td>
                    <button className="danger" onClick={() => handleDelete(s.id)}>Delete</button>
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

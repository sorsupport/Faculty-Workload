import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { Course } from "../types";

export function CoursesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", title: "", creditHours: "3", department: "" });

  async function load() {
    setCourses(await api.get<Course[]>("/courses"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/courses", form);
      setForm({ code: "", title: "", creditHours: "3", department: "" });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this course? Its sections will also be removed.")) return;
    try {
      await api.del(`/courses/${id}`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Courses</h2>
        {isAdmin && (
          <button className="primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add Course"}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && isAdmin && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Code
              <input required placeholder="CS101" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
            <label>
              Title
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Credit Hours
              <input required type="number" step="0.5" min="0" value={form.creditHours} onChange={(e) => setForm({ ...form, creditHours: e.target.value })} />
            </label>
            <label>
              Department
              <input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </label>
          </div>
          <button className="primary" type="submit">Save Course</button>
        </form>
      )}

      {courses.length === 0 ? (
        <p className="empty-state">No courses yet. Add one to get started.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Credit Hours</th>
              <th>Department</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.title}</td>
                <td>{c.creditHours}</td>
                <td>{c.department}</td>
                {isAdmin && (
                  <td>
                    <button className="danger" onClick={() => handleDelete(c.id)}>Delete</button>
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

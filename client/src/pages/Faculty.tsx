import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { Faculty } from "../types";

const EMPLOYMENT_TYPES = ["full-time", "part-time", "adjunct"];

export function FacultyPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", department: "", employmentType: "full-time", maxLoad: "12" });

  async function load() {
    setFaculty(await api.get<Faculty[]>("/faculty"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/faculty", form);
      setForm({ name: "", email: "", department: "", employmentType: "full-time", maxLoad: "12" });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this faculty member? Their assignments will also be removed.")) return;
    try {
      await api.del(`/faculty/${id}`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Faculty</h2>
        {isAdmin && (
          <button className="primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add Faculty"}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && isAdmin && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Department
              <input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </label>
            <label>
              Employment Type
              <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Max Load (hours/term)
              <input required type="number" step="0.5" min="0" value={form.maxLoad} onChange={(e) => setForm({ ...form, maxLoad: e.target.value })} />
            </label>
          </div>
          <button className="primary" type="submit">Save Faculty</button>
        </form>
      )}

      {faculty.length === 0 ? (
        <p className="empty-state">No faculty yet. Add one to get started.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Type</th>
              <th>Max Load</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {faculty.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.email}</td>
                <td>{f.department}</td>
                <td>{f.employmentType}</td>
                <td>{f.maxLoad}</td>
                {isAdmin && (
                  <td>
                    <button className="danger" onClick={() => handleDelete(f.id)}>Delete</button>
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

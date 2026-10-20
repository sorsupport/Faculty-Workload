import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { TermSelect } from "../components/TermSelect";
import { FacultyLoadList } from "../components/FacultyLoadList";
import { useTermLoads } from "../hooks/useTermLoads";
import type { Course, Section } from "../types";

export function AdminDashboardPage() {
  const { terms, selectedTermId, setSelectedTermId, loads, error } = useTermLoads();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    api.get<Course[]>("/courses").then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTermId) return;
    api.get<Section[]>(`/sections?termId=${selectedTermId}`).then(setSections).catch(() => {});
  }, [selectedTermId]);

  const unassignedSections = sections.filter((s) => s.assignments.length === 0).length;
  const overloadedCount = loads.filter((l) => l.status === "over").length;

  return (
    <div>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <TermSelect terms={terms} value={selectedTermId} onChange={setSelectedTermId} />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{loads.length}</div>
          <div className="stat-label">Faculty</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{courses.length}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${unassignedSections > 0 ? "warn" : ""}`}>{sections.length}</div>
          <div className="stat-label">Sections this term{unassignedSections > 0 ? ` (${unassignedSections} unassigned)` : ""}</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${overloadedCount > 0 ? "danger" : ""}`}>{overloadedCount}</div>
          <div className="stat-label">Faculty overloaded</div>
        </div>
      </div>

      <div className="quick-links">
        <Link to="/faculty"><button>+ Add Faculty</button></Link>
        <Link to="/courses"><button>+ Add Course</button></Link>
        <Link to="/terms"><button>+ Add Term</button></Link>
        <Link to="/sections"><button>+ Add Section</button></Link>
        <Link to="/assignments"><button>+ Assign Faculty</button></Link>
      </div>

      <p className="section-label">Faculty load</p>

      {terms.length > 0 && loads.length === 0 && (
        <p className="empty-state">No faculty yet. Add some on the Faculty page.</p>
      )}

      <FacultyLoadList loads={loads} />
    </div>
  );
}

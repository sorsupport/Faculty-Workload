import type { FacultyLoad } from "../types";

export function FacultyLoadList({ loads }: { loads: FacultyLoad[] }) {
  return (
    <div className="faculty-card-list">
      {loads.map((l) => {
        const pct = l.maxLoad > 0 ? Math.min(100, (l.totalLoad / l.maxLoad) * 100) : 0;
        return (
          <div className="faculty-card" key={l.facultyId}>
            <div className="faculty-card-top">
              <div>
                <strong>{l.name}</strong>{" "}
                <span className="meta">
                  {l.department} · {l.employmentType}
                </span>
              </div>
              <div>
                <span className={`badge ${l.status}`}>
                  {l.totalLoad} / {l.maxLoad} hrs — {l.status === "over" ? "overloaded" : l.status === "at" ? "at capacity" : "under"}
                </span>
              </div>
            </div>
            <div className="load-bar-track">
              <div className={`load-bar-fill ${l.status}`} style={{ width: `${pct}%` }} />
            </div>
            {l.assignments.length > 0 && (
              <div className="assignment-chip-row">
                {l.assignments.map((a) => (
                  <span className="assignment-chip" key={a.id}>
                    {a.courseCode} §{a.sectionNumber} ({a.loadHours}h{a.role === "co-instructor" ? ", co" : ""})
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { TermSelect } from "../components/TermSelect";
import { FacultyLoadList } from "../components/FacultyLoadList";
import { useTermLoads } from "../hooks/useTermLoads";

export function UserDashboardPage() {
  const { terms, selectedTermId, setSelectedTermId, loads, error } = useTermLoads();

  return (
    <div>
      <div className="page-header">
        <h2>Load Dashboard</h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <TermSelect terms={terms} value={selectedTermId} onChange={setSelectedTermId} />

      {terms.length > 0 && loads.length === 0 && (
        <p className="empty-state">No faculty yet.</p>
      )}

      <FacultyLoadList loads={loads} />
    </div>
  );
}

import type { Term } from "../types";

export function TermSelect({
  terms,
  value,
  onChange,
}: {
  terms: Term[];
  value: number | null;
  onChange: (termId: number) => void;
}) {
  if (terms.length === 0) {
    return <p className="empty-state">No terms yet. Create one on the Terms page.</p>;
  }
  return (
    <div className="term-select-bar">
      <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        Term
        <select value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))}>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

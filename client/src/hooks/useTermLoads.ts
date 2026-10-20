import { useEffect, useState } from "react";
import { api } from "../api";
import type { FacultyLoad, Term } from "../types";

export function useTermLoads() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [loads, setLoads] = useState<FacultyLoad[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Term[]>("/terms")
      .then((t) => {
        setTerms(t);
        if (t.length > 0) setSelectedTermId(t[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedTermId) return;
    api
      .get<FacultyLoad[]>(`/loads?termId=${selectedTermId}`)
      .then(setLoads)
      .catch((e) => setError(e.message));
  }, [selectedTermId]);

  return { terms, selectedTermId, setSelectedTermId, loads, error };
}

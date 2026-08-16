import type { AnalysisHistory } from "../types";

const byCreatedAtDesc = (a: AnalysisHistory, b: AnalysisHistory) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

/** Ordena análises da mais recente para a mais antiga (GET /analyses retorna DESC). */
export function sortAnalysesDesc(analyses: AnalysisHistory[]): AnalysisHistory[] {
  return [...analyses].sort(byCreatedAtDesc);
}

/** Retorna a análise mais recente, ou undefined se a lista estiver vazia. */
export function latestAnalysis(analyses: AnalysisHistory[]): AnalysisHistory | undefined {
  return sortAnalysesDesc(analyses)[0];
}

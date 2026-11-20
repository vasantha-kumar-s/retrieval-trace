// Lexical overlap scoring: how much of an item's vocabulary reached the answer.
const STOP = new Set(["the","and","for","that","this","with","from","was","were","are","has","have","not","but","its","also","into","over","after"]);
const WORD_RE = /[a-z0-9][a-z0-9_#-]{2,}/g;
export const USED_THRESHOLD = 0.2;

export function tokens(text: string): Set<string> {
  return new Set((text.toLowerCase().match(WORD_RE) ?? []).filter((w) => !STOP.has(w)));
}

export function answerOverlap(answer: string | null | undefined, content: string | null | undefined): number | null {
  if (!answer || !content) return null;
  const a = tokens(answer);
  const t = tokens(content);
  if (!a.size || !t.size) return null;
  let shared = 0;
  t.forEach((w) => { if (a.has(w)) shared++; });
  return Math.round((shared / Math.min(a.size, t.size)) * 1000) / 1000;
}

export function isUsed(overlap: number | null): boolean {
  return (overlap ?? 0) >= USED_THRESHOLD;
}

export type Span = { id: string; name: string; kind: string; parent_id?: string | null; start_ms: number; end_ms?: number | null; status: string };
export type RetrievedItem = { id: string; label: string; kind?: string; score?: number | null; content?: string | null; source_uri?: string | null; answer_overlap?: number | null };
export type Retrieval = { span_id: string; query: string; arm?: string; items: RetrievedItem[] };
export type AgentTrace = { query: string; framework?: string; spans: Span[]; retrievals: Retrieval[]; answer?: string | null; latency_ms?: number | null };

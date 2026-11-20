import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { answerOverlap, isUsed, USED_THRESHOLD, type AgentTrace } from "@/lib/overlap";
import { demoTrace } from "@/lib/demo-trace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Residue — see what your agent actually used" },
      { name: "description", content: "Trace an agent run and mark every retrieved item as used or unused in the final answer. Runs fully in your browser." },
      { property: "og:title", content: "Residue — see what your agent actually used" },
      { property: "og:description", content: "Retrieved vs used, scored against the final answer. Nothing leaves your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [trace, setTrace] = useState<AgentTrace>(demoTrace);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const scored = useMemo(
    () => trace.retrievals.map((r) => ({
      ...r,
      span: trace.spans.find((s) => s.id === r.span_id),
      items: r.items.map((i) => {
        const ov = i.answer_overlap ?? answerOverlap(trace.answer, i.content);
        return { ...i, ov, used: trace.answer ? isUsed(ov) : null };
      }),
    })),
    [trace],
  );
  const all = scored.flatMap((r) => r.items);
  const used = all.filter((i) => i.used).length;
  const total = Math.max(...trace.spans.map((s) => s.end_ms ?? s.start_ms), 1);

  async function load(file: File) {
    try {
      const t = JSON.parse(await file.text()) as AgentTrace;
      if (!t.query || !Array.isArray(t.retrievals)) throw new Error("Not a trace file");
      setTrace({ ...t, spans: t.spans ?? [] });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read file");
    }
  }

  return (
    <main className="min-h-screen grid-bg">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-mono text-lg font-semibold">
            <span className="inline-block h-3 w-3 bg-primary" /> residue
          </div>
          <div className="flex gap-2 font-mono text-xs">
            <button onClick={() => setTrace(demoTrace)} className="border border-border px-3 py-2 hover:border-primary">demo run</button>
            <label className="cursor-pointer bg-primary px-3 py-2 text-primary-foreground hover:opacity-90">
              open trace.json
              <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
            </label>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          See what your agent retrieved, <span className="text-primary">and what it actually used.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Every retrieved item is scored against the final answer by lexical overlap. No model re-reads your evidence, and nothing leaves this browser.
        </p>
        {error && <p className="mt-4 font-mono text-sm text-destructive">{error}</p>}

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Stat label="query" value={trace.query} wide />
          <Stat label="retrieved" value={String(all.length)} />
          <Stat label="used" value={trace.answer ? `${used} / ${all.length}` : "—"} accent />
        </div>

        <div className="mt-6 border border-border bg-card p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">timeline · {trace.framework ?? "custom"}</p>
          <div className="mt-4 space-y-2">
            {trace.spans.map((s) => (
              <div key={s.id} className="flex items-center gap-3 font-mono text-xs">
                <span className="w-32 shrink-0 truncate">{s.name}</span>
                <div className="relative h-5 flex-1 bg-muted">
                  <div
                    className={s.kind === "retriever" ? "absolute h-full bg-primary/70" : s.kind === "llm" ? "absolute h-full bg-accent/70" : "absolute h-full bg-chart-3/70"}
                    style={{ left: `${(s.start_ms / total) * 100}%`, width: `${Math.max((((s.end_ms ?? s.start_ms) - s.start_ms) / total) * 100, 1)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-muted-foreground">{Math.round((s.end_ms ?? s.start_ms) - s.start_ms)}ms</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {scored.map((r) => (
              <div key={r.span_id} className="border border-border bg-card">
                <div className="flex justify-between border-b border-border px-5 py-3 font-mono text-xs text-muted-foreground">
                  <span>{r.span?.name ?? r.span_id} · “{r.query}”</span><span>{r.arm ?? "unknown"}</span>
                </div>
                {r.items.map((i) => (
                  <button key={i.id} onClick={() => setOpen(open === i.id ? null : i.id)} className="block w-full border-b border-border px-5 py-4 text-left last:border-0 hover:bg-secondary">
                    <div className="flex items-center justify-between gap-4">
                      <span className={i.used === false ? "text-muted-foreground line-through decoration-destructive/60" : ""}>{i.label}</span>
                      <span className="flex shrink-0 gap-3 font-mono text-xs">
                        <span className="text-muted-foreground">score {i.score?.toFixed(3) ?? "—"}</span>
                        {i.used === null ? null : i.used
                          ? <span className="bg-primary px-2 py-0.5 text-primary-foreground">used {i.ov?.toFixed(2)}</span>
                          : <span className="border border-destructive/60 px-2 py-0.5 text-destructive">no trace {i.ov?.toFixed(2) ?? "0"}</span>}
                      </span>
                    </div>
                    {open === i.id && i.content && <p className="mt-3 font-mono text-xs text-muted-foreground">{i.content}</p>}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <aside className="h-fit border border-primary/40 bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">final answer</p>
            <p className="mt-3 leading-relaxed">{trace.answer ?? "No answer in this trace — usage can't be scored."}</p>
            <p className="mt-6 font-mono text-xs text-muted-foreground">An item counts as used at ≥ {USED_THRESHOLD} overlap.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, wide, accent }: { label: string; value: string; wide?: boolean; accent?: boolean }) {
  return (
    <div className={`border border-border bg-card p-5 ${wide ? "md:col-span-2" : ""}`}>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 truncate text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

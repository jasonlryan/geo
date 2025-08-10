"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createRun, getRunBundle, apiBaseUrl } from "@/lib/api";
import ExportsBar from "@/components/ExportsBar";
import ViewReport from "@/components/ViewReport";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
// Insights is now a dedicated route: /insights

// No hardcoded subjects - user can type any subject

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("Executive Search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"sources" | "analysis">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "analysis") return "analysis";
    }
    return "sources";
  });

  // Keep tab in sync with URL changes (e.g., header link clicks)
  useEffect(() => {
    const tab = (searchParams.get("tab") || "").toLowerCase();
    if (tab === "analysis" && activeTab !== "analysis")
      setActiveTab("analysis");
    else if (tab === "sources" && activeTab !== "sources")
      setActiveTab("sources");
  }, [searchParams]);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("");
  const [credBandFilter, setCredBandFilter] = useState<string>("");

  const runQuery = async (q: string) => {
    setLoading(true);
    setError(null);
    setBundle(null);
    try {
      const { run_id } = await createRun(q, subject, true);
      const data = await getRunBundle(run_id);
      setBundle({ run_id, ...data });
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("lastRunId", run_id);
        }
      } catch {}
    } catch (err: any) {
      setError(err?.message || "Failed to run search");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runQuery(query);
  };

  const generateRandomQuery = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/search/random-query?subject=${encodeURIComponent(subject)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const q = data.query;
      setQuery(q);
      return q;
    } catch (error) {
      console.error("Failed to generate random query:", error);
      // Don't set query - let user know it failed
      setError(
        "Failed to generate random query. Please try again or enter your own query."
      );
      return null;
    }
  };

  const computeCredBand = (score?: number) => {
    if (typeof score !== "number") return "?";
    if (score >= 0.8) return "A";
    if (score >= 0.6) return "B";
    if (score >= 0.4) return "C";
    return "D";
  };

  // Restore last run bundle when returning from other pages
  useEffect(() => {
    const restore = async () => {
      if (bundle) return;
      try {
        const rid =
          typeof window !== "undefined"
            ? window.localStorage.getItem("lastRunId")
            : null;
        if (!rid) return;
        setLoading(true);
        const data = await getRunBundle(rid);
        setBundle({ run_id: rid, ...data });
      } catch (e) {
        // ignore; user can run a new search
      } finally {
        setLoading(false);
      }
    };
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize sources to a safe array regardless of backend shape
  const sourcesList: any[] = useMemo(() => {
    return Array.isArray((bundle as any)?.sources)
      ? ((bundle as any).sources as any[])
      : [];
  }, [bundle]);

  const filteredSources =
    sourcesList.filter((s: any) => {
      const band = computeCredBand(s?.credibility?.score);
      const mediaOk = mediaTypeFilter
        ? s?.media_type === mediaTypeFilter
        : true;
      const bandOk = credBandFilter ? band === credBandFilter : true;
      return mediaOk && bandOk;
    }) ?? [];

  const uniqueMediaTypes = Array.from(
    new Set(sourcesList.map((s: any) => s.media_type).filter(Boolean))
  );
  const uniqueCredBands = ["A", "B", "C", "D"];

  const safeArray = (v: any) => (Array.isArray(v) ? v : []);
  const claimsList = safeArray(bundle?.claims);
  const evidenceList = safeArray(bundle?.evidence);
  const evidenceByClaim: Record<string, Set<string>> = {};
  for (const e of evidenceList) {
    const cid = e.claim_id;
    const sid = e.source_id;
    if (!evidenceByClaim[cid]) evidenceByClaim[cid] = new Set();
    evidenceByClaim[cid].add(sid);
  }

  const categorize = (s: any): string => {
    const domain: string = s?.domain || "";
    const tld = domain.split(".").pop() || "";
    const mt = (s?.media_type || "").toLowerCase();
    if (domain.endsWith(".gov") || tld === "gov") return "gov";
    if (
      domain.endsWith(".edu") ||
      domain.includes("ac.") ||
      domain.includes(".ac.")
    )
      return "academic";
    if (mt.includes("paper") || domain.includes("arxiv")) return "academic";
    if (
      domain.includes("twitter") ||
      domain.includes("x.com") ||
      domain.includes("reddit") ||
      domain.includes("tiktok") ||
      domain.includes("youtube")
    )
      return "social";
    if (
      domain.includes(".who.int") ||
      domain.includes(".europa.eu") ||
      domain.includes(".un.org")
    )
      return "agency";
    if (mt.includes("doc")) return "documentation";
    if (mt.includes("news") || mt.includes("blog")) return "news/blog";
    return "web";
  };

  // Render answer text with clickable [n] citation markers
  const escapeHtml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const answerHtml = useMemo(() => {
    if (!bundle?.answer?.text) return "";
    const idToIdx: Record<string, number> = {};
    sourcesList.forEach((s: any, i: number) => {
      idToIdx[s.source_id] = i + 1;
    });
    let html = escapeHtml(bundle.answer.text);
    html = html.replace(/src_[a-z0-9_\-]+/gi, (m) => {
      const idx = idToIdx[m];
      const s = sourcesList.find((x: any) => x.source_id === m);
      if (!idx || !s) return m;
      const title = escapeHtml(s.title || s.domain || s.url || m);
      const url = s.url || "#";
      return `<sup><a class="underline decoration-dotted" href="${url}" target="_blank" title="${title}">[${idx}]</a></sup>`;
    });
    return html;
  }, [bundle]);

  // LLM analysis state (inline in Analysis panel)
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmData, setLlmData] = useState<any | null>(null);

  const runLlmAnalysis = async () => {
    if (!bundle?.run?.run_id) return;
    setLlmLoading(true);
    setLlmError(null);
    setLlmData(null);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/runs/${bundle.run.run_id}/llm_citation_analysis`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if ((json && json.analysis) || json.classifications) setLlmData(json);
      else setLlmError("Analysis failed");
    } catch (e: any) {
      setLlmError(e?.message || "Analysis failed");
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search Query
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-md px-3 py-2 min-h-[96px] resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ask a question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subject Area
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., AI & Technology"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !query.trim()}
          >
            {loading ? "Running…" : "Run Search"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={async () => {
              await generateRandomQuery();
            }}
          >
            Random Query
          </Button>
        </div>
      </form>

      {loading && (
        <div
          className="flex items-center gap-2 text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          <Spinner />
          <span>Running search…</span>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {bundle && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Answer</CardTitle>
              </CardHeader>
              <CardBody>
                <div
                  className="leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: answerHtml }}
                />
                <div className="text-xs text-slate-500">
                  Run ID: {bundle.run_id} · API: {apiBaseUrl} ·{" "}
                  <a
                    className="underline text-blue-600 hover:text-blue-800"
                    href={`/trace/${bundle.run_id}`}
                  >
                    View trace
                  </a>
                </div>
                <div className="pt-2">
                  <ExportsBar bundle={bundle} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Claims</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2 list-disc pl-5">
                  {claimsList.map((c: any) => (
                    <li key={c.claim_id}>
                      <span className="font-medium">
                        #{c.answer_sentence_index + 1}:
                      </span>{" "}
                      {c.text}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-4 lg:col-span-5">
            <Card className="p-0 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => {
                    setActiveTab("sources");
                    router.replace("/search?tab=sources", { scroll: false });
                  }}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "sources"
                      ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Sources
                </button>
                <button
                  onClick={() => {
                    setActiveTab("analysis");
                    router.replace("/search?tab=analysis", { scroll: false });
                  }}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "analysis"
                      ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Analysis
                </button>
              </div>
              <div className="p-4">
                {activeTab === "sources" && (
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center text-sm">
                      <select
                        className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={mediaTypeFilter}
                        onChange={(e) => setMediaTypeFilter(e.target.value)}
                      >
                        <option value="">All types</option>
                        {uniqueMediaTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <select
                        className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={credBandFilter}
                        onChange={(e) => setCredBandFilter(e.target.value)}
                      >
                        <option value="">All bands</option>
                        {uniqueCredBands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    {filteredSources.map((s: any, idx: number) => (
                      <div key={s.source_id} className="text-sm">
                        <div className="font-medium">
                          [{idx + 1}] {s.title}
                        </div>
                        <div className="text-slate-600">
                          {s.domain} · {categorize(s)} · cred{" "}
                          {s.credibility.score} ·{" "}
                          <a
                            className="underline text-blue-600 hover:text-blue-800"
                            href={s.url}
                            target="_blank"
                          >
                            open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "analysis" && (
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-center">
                      <ViewReport bundle={bundle} />
                    </div>
                    <div>
                      <div className="font-medium mb-1">Funnel</div>
                      <div className="text-slate-700">
                        Proposed: {bundle.analysis?.funnel?.proposed ?? 0} ·
                        Fetched: {bundle.analysis?.funnel?.fetched ?? 0} ·
                        Cited: {bundle.analysis?.funnel?.cited ?? 0}
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium mb-1">
                            Proposed (top 10)
                          </div>
                          <ul className="text-xs list-disc pl-5 max-h-40 overflow-auto">
                            {(bundle.provider_results || [])
                              .slice(0, 10)
                              .map((r: any, i: number) => (
                                <li key={i}>
                                  <a
                                    className="underline text-blue-600 hover:text-blue-800"
                                    href={r.url}
                                    target="_blank"
                                  >
                                    {r.title || r.url}
                                  </a>
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">
                            Fetched (top 10)
                          </div>
                          <ul className="text-xs list-disc pl-5 max-h-40 overflow-auto">
                            {(bundle.fetched_docs || [])
                              .slice(0, 10)
                              .map((d: any, i: number) => (
                                <li key={i}>
                                  <a
                                    className="underline text-blue-600 hover:text-blue-800"
                                    href={d.url}
                                    target="_blank"
                                  >
                                    {d.title || d.url}
                                  </a>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Top domains</div>
                      <ul className="list-disc pl-5">
                        {(bundle.analysis?.mix?.domains_top ?? []).map(
                          (pair: any) => (
                            <li key={pair[0]}>
                              {pair[0]} — {pair[1]}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Coverage per claim</div>
                      <ul className="list-disc pl-5">
                        {bundle.claims.map((c: any) => (
                          <li key={c.claim_id}>
                            #{c.answer_sentence_index + 1}:{" "}
                            {bundle.analysis?.coverage_per_claim?.[
                              c.claim_id
                            ] ?? 0}{" "}
                            sources
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Coverage matrix</div>
                      <div className="overflow-auto">
                        <table className="min-w-full border text-xs">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1 text-left">
                                Claim \\ Source
                              </th>
                              {sourcesList.map((s: any, i: number) => (
                                <th
                                  key={s.source_id}
                                  className="border px-2 py-1"
                                >
                                  [{i + 1}]
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {claimsList.map((c: any) => (
                              <tr key={c.claim_id}>
                                <td className="border px-2 py-1 align-top">
                                  #{c.answer_sentence_index + 1}
                                </td>
                                {sourcesList.map((s: any) => (
                                  <td
                                    key={s.source_id}
                                    className="border px-2 py-1 text-center"
                                  >
                                    {evidenceByClaim[c.claim_id]?.has(
                                      s.source_id
                                    )
                                      ? "●"
                                      : ""}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Insights content lives at /insights */}
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

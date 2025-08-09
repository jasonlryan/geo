"use client";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/api";

export default function InsightsPanel() {
  const [recent, setRecent] = useState<{ run_id: string; ts: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agg, setAgg] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/api/insights/recent`);
        const json = await res.json();
        const items = (json.items || []).map((x: any) => ({
          run_id: x.run_id,
          ts: x.ts,
        }));
        setRecent(items);
        const res2 = await fetch(`${apiBaseUrl}/api/insights/aggregate`);
        const json2 = await res2.json();
        setAgg(json2);
      } catch (e: any) {
        setError(e?.message || "Failed to load insights");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4 text-sm">
      <div className="font-medium">Recent Runs</div>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <ul className="divide-y border rounded">
          {recent.slice(0, 20).map((r) => (
            <li
              key={r.run_id}
              className="p-2 flex items-center justify-between"
            >
              <span className="truncate">{r.run_id}</span>
              <span className="text-xs text-gray-500">
                {new Date(r.ts * 1000).toLocaleString()}
              </span>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="p-3 text-gray-600">No runs yet</li>
          )}
        </ul>
      )}
      <div className="text-xs text-gray-500">
        Powered by Redis indices: recent ZSET, versioned by PIPELINE_VERSION.
      </div>

      <div className="pt-4 space-y-2">
        <div className="font-medium">Aggregate Patterns (last 50 runs)</div>
        {!agg && !loading && <div className="text-gray-600">No data</div>}
        {agg && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="bg-white border rounded p-2">
                <div className="text-xl font-semibold">{agg.runs}</div>
                <div className="text-xs text-gray-600">Runs</div>
              </div>
              <div className="bg-white border rounded p-2">
                <div className="text-xl font-semibold">
                  {agg.totals.total_sources}
                </div>
                <div className="text-xs text-gray-600">Total sources</div>
              </div>
              <div className="bg-white border rounded p-2">
                <div className="text-xl font-semibold">
                  {agg.totals.total_cited_sources}
                </div>
                <div className="text-xs text-gray-600">Cited sources</div>
              </div>
              <div className="bg-white border rounded p-2">
                <div className="text-xl font-semibold">
                  {(agg.totals.avg_citation_rate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Avg citation rate</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium mb-1">Top cited domains</div>
              <ul className="text-xs list-disc pl-5 max-h-48 overflow-auto">
                {(agg.domains_top || []).map((p: any) => (
                  <li key={p[0]}>
                    {p[0]} — {p[1]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

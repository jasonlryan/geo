export type RunBundle = {
  run: any;
  sources: any[];
  claims: any[];
  evidence: any[];
  classifications?: any[];
  answer?: { text: string };
  analysis?: any;
};

export function buildSourceIndexMap(sources: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  sources.forEach((s, i) => {
    map[s.source_id] = i + 1; // 1-based index for display
  });
  return map;
}

export function citationsForClaim(claimId: string, evidence: any[], sourceIndexById: Record<string, number>): number[] {
  const indices = new Set<number>();
  for (const e of evidence) {
    if (e.claim_id === claimId) {
      const idx = sourceIndexById[e.source_id];
      if (idx) indices.add(idx);
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

export function answerMarkdown(bundle: RunBundle): string {
  const sourceIndexById = buildSourceIndexMap(bundle.sources || []);
  const sentences = [...(bundle.claims || [])].sort((a, b) => (a.answer_sentence_index ?? 0) - (b.answer_sentence_index ?? 0));
  const lines: string[] = [];
  for (const c of sentences) {
    const cites = citationsForClaim(c.claim_id, bundle.evidence || [], sourceIndexById);
    const citeStr = cites.length ? ` [${cites.join(",")}]` : " [uncited]";
    lines.push(`${c.text}${citeStr}`);
  }
  lines.push("\nSources:");
  bundle.sources?.forEach((s, i) => {
    const idx = i + 1;
    const title = s.title || s.url;
    lines.push(`${idx}. ${title} — ${s.url}`);
  });
  return lines.join("\n");
}

export function answerHTML(bundle: RunBundle): string {
  const sourceIndexById = buildSourceIndexMap(bundle.sources || []);
  const sentences = [...(bundle.claims || [])].sort((a, b) => (a.answer_sentence_index ?? 0) - (b.answer_sentence_index ?? 0));
  const parts: string[] = [];
  for (const c of sentences) {
    const cites = citationsForClaim(c.claim_id, bundle.evidence || [], sourceIndexById);
    const citeLinks = cites.map((n) => `<sup>[<a href="#src-${n}">${n}</a>]</sup>`).join("");
    const fallback = cites.length ? citeLinks : '<sup class="text-amber-600">[uncited]</sup>';
    parts.push(`<p>${escapeHtml(c.text)} ${fallback}</p>`);
  }
  parts.push("<h3>Sources</h3>");
  bundle.sources?.forEach((s, i) => {
    const idx = i + 1;
    const title = escapeHtml(s.title || s.url);
    const url = escapeHtml(s.url || "");
    parts.push(`<div id="src-${idx}">${idx}. <a href="${url}" target="_blank" rel="noreferrer">${title}</a></div>`);
  });
  return parts.join("\n");
}

export function sourcesCSV(bundle: RunBundle): string {
  const headers = ["index","source_id","title","url","domain","media_type","cred_score","published_at"]; 
  const rows = [headers.join(",")];
  (bundle.sources || []).forEach((s, i) => {
    const vals = [
      (i+1).toString(),
      q(s.source_id),
      q(s.title),
      q(s.url),
      q(s.domain),
      q(s.media_type),
      (s.credibility?.score ?? "").toString(),
      q(s.published_at),
    ];
    rows.push(vals.join(","));
  });
  return rows.join("\n");
}

export function sourcesJSON(bundle: RunBundle): string {
  return JSON.stringify({
    run: bundle.run,
    sources: bundle.sources,
    claims: bundle.claims,
    evidence: bundle.evidence,
    classifications: bundle.classifications,
    analysis: bundle.analysis,
  }, null, 2);
}

export function methodsMarkdown(bundle: RunBundle): string {
  const lines: string[] = [];
  lines.push(`# Methods`);
  lines.push(`- Query: ${bundle.run?.query}`);
  lines.push(`- Run ID: ${bundle.run?.run_id}`);
  lines.push(`- Created: ${bundle.run?.created_at}`);
  const a = bundle.analysis || {};
  if (a.funnel) lines.push(`- Funnel: proposed ${a.funnel.proposed}, fetched ${a.funnel.fetched}, cited ${a.funnel.cited}`);
  return lines.join("\n");
}

function q(v: any): string {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}



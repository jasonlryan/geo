export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export async function createRun(query: string, subject: string = "Executive Search", force: boolean = true): Promise<{ run_id: string }> {
  const res = await fetch(`${apiBaseUrl}/api/search/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, subject, force }),
    cache: "no-store",
  });
  return json(res);
}

export async function getRunBundle(runId: string): Promise<{
  run: any;
  sources: any[];
  claims: any[];
  evidence: any[];
  classifications: any[];
  answer: { text: string };
}> {
  const [run, sources, claims, evidence, classifications, trace] = await Promise.all([
    fetch(`${apiBaseUrl}/api/runs/${runId}`, { cache: "no-store" }),
    fetch(`${apiBaseUrl}/api/runs/${runId}/sources`, { cache: "no-store" }),
    fetch(`${apiBaseUrl}/api/runs/${runId}/claims`, { cache: "no-store" }),
    fetch(`${apiBaseUrl}/api/runs/${runId}/evidence`, { cache: "no-store" }),
    fetch(`${apiBaseUrl}/api/runs/${runId}/classifications`, { cache: "no-store" }),
    fetch(`${apiBaseUrl}/api/runs/${runId}/trace`, { cache: "no-store" }),
  ]);

  return {
    run: await run.json(),
    sources: await sources.json(),
    claims: await claims.json(),
    evidence: await evidence.json(),
    classifications: await classifications.json(),
    ...(await trace.json()),
  } as any;
}

export async function generateRandomQuery(subject: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/api/search/random-query?subject=${encodeURIComponent(subject)}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.query;
}


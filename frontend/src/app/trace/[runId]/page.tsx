import { getRunBundle } from "@/lib/api";

export default async function TracePage({
  params,
}: {
  params: { runId: string };
}) {
  const data = await getRunBundle(params.runId);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Trace — {params.runId}</h1>
      <pre className="bg-white border rounded p-4 overflow-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

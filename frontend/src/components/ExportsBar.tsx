"use client";
import {
  answerMarkdown,
  answerHTML,
  sourcesCSV,
  sourcesJSON,
  methodsMarkdown,
  RunBundle,
} from "@/lib/format";

function download(
  name: string,
  contents: string,
  type = "text/plain;charset=utf-8"
) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportsBar({ bundle }: { bundle: RunBundle }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="border px-3 py-1 rounded"
        onClick={() => navigator.clipboard.writeText(answerMarkdown(bundle))}
      >
        Copy Markdown
      </button>
      <button
        className="border px-3 py-1 rounded"
        onClick={() => navigator.clipboard.writeText(answerHTML(bundle))}
      >
        Copy HTML
      </button>
      <button
        className="border px-3 py-1 rounded"
        onClick={() => download("sources.csv", sourcesCSV(bundle), "text/csv")}
      >
        Download CSV
      </button>
      <button
        className="border px-3 py-1 rounded"
        onClick={() =>
          download("sources.json", sourcesJSON(bundle), "application/json")
        }
      >
        Download JSON
      </button>
      <button
        className="border px-3 py-1 rounded"
        onClick={() => download("methods.md", methodsMarkdown(bundle))}
      >
        Download Methods
      </button>
    </div>
  );
}

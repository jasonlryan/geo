"use client";
import MainInsightsPanel from "@/components/MainInsightsPanel";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          AI Search Marketing Intelligence
        </h1>
        <div className="text-sm text-slate-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Cross-run analytics & Intelligence Reports
        </div>
      </div>
      <MainInsightsPanel />
    </div>
  );
}

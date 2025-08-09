"use client";
import React, { useState } from "react";
import Modal from "@/components/Modal";
import {
  RunBundle,
  sourcesCSV,
  sourcesJSON,
  methodsMarkdown,
  answerMarkdown,
} from "@/lib/format";
import { apiBaseUrl } from "@/lib/api";
import { marked } from "marked";

export default function ViewReport({ bundle }: { bundle: RunBundle }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportMd, setReportMd] = useState<string>("");
  const [reportHtml, setReportHtml] = useState<string>("");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const ready = !!analysisData; // Render dashboard only when analysis is complete
  const download = (
    name: string,
    contents: string,
    type = "text/plain;charset=utf-8"
  ) => {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const proposed = (bundle as any).provider_results || [];
  const fetched = (bundle as any).fetched_docs || [];

  const renderModalBody = () => {
    if (!ready) {
      return (
        <div className="flex items-center justify-center h-[70vh] text-gray-700">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <div>
              <div className="font-medium">Analyzing AI search mechanism…</div>
              <div className="text-sm text-gray-500">
                Reverse-engineering source selection patterns and visibility
                factors
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Query context - compact */}
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
          <strong>Query:</strong> {bundle.run?.query} |{" "}
          <strong>AI Search Funnel:</strong>{" "}
          {bundle.analysis?.funnel?.proposed ?? 0} sources proposed →{" "}
          {bundle.analysis?.funnel?.fetched ?? 0} fetched →{" "}
          {bundle.analysis?.funnel?.cited ?? 0} actually cited by AI
        </div>

        {/* AI Search Performance Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-blue-900 mb-1">
            AI Search Performance Summary
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Real metrics that matter for content strategy
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {bundle.sources?.length || 0}
              </div>
              <div className="text-sm font-medium text-blue-600">
                Sources AI Found
              </div>
              <div className="text-xs text-blue-500 mt-1">
                {bundle.sources?.length === 0
                  ? "Opportunity: Low competition"
                  : bundle.sources?.length < 5
                  ? "Moderate competition"
                  : "High competition space"}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-3xl font-bold text-green-700 mb-1">
                {new Set(bundle.sources?.map((s: any) => s.domain) || []).size}
              </div>
              <div className="text-sm font-medium text-green-600">
                Unique Publishers
              </div>
              <div className="text-xs text-green-500 mt-1">
                {new Set(bundle.sources?.map((s: any) => s.domain) || []).size <
                3
                  ? "Low diversity - opportunity!"
                  : new Set(bundle.sources?.map((s: any) => s.domain) || [])
                      .size > 8
                  ? "High diversity - competitive"
                  : "Moderate diversity"}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {bundle.sources?.length > 0
                  ? Math.round(
                      ((bundle.evidence?.length || 0) / bundle.sources.length) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm font-medium text-purple-600">
                Citation Rate
              </div>
              <div className="text-xs text-purple-500 mt-1">
                Sources actually cited by AI
              </div>
            </div>
          </div>
        </div>

        {/* Who Actually Gets Cited */}
        {bundle.evidence?.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-orange-900 mb-1">
              Who Actually Gets Cited?
            </h3>
            <p className="text-sm text-orange-700 mb-4">
              Analysis of sources that AI actually referenced in the answer
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="text-lg font-semibold text-orange-800 mb-3">
                  🏆 Cited Sources Only
                </h4>
                <div className="space-y-2">
                  {(() => {
                    // Get ONLY sources that were actually cited
                    const citedSourceIds = new Set(
                      bundle.evidence.map((e: any) => e.source_id)
                    );
                    const citedSources =
                      bundle.sources?.filter((s: any) =>
                        citedSourceIds.has(s.source_id)
                      ) || [];

                    return Array.from(
                      new Set(citedSources.map((s: any) => s.domain))
                    )
                      .slice(0, 5)
                      .map((domain: string, i: number) => {
                        const domainSources = citedSources.filter(
                          (s: any) => s.domain === domain
                        );
                        const citationCount =
                          bundle.evidence?.filter((e: any) =>
                            domainSources.some(
                              (ds: any) => ds.source_id === e.source_id
                            )
                          ).length || 0;

                        return (
                          <div
                            key={i}
                            className="flex justify-between items-center py-2 border-b border-orange-100 last:border-b-0"
                          >
                            <div>
                              <div className="font-medium text-orange-900">
                                {domain}
                              </div>
                              <div className="text-xs text-orange-600">
                                {domainSources.length} source
                                {domainSources.length !== 1 ? "s" : ""} •{" "}
                                {citationCount} citation
                                {citationCount !== 1 ? "s" : ""}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-orange-700">
                              #{i + 1}
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="text-lg font-semibold text-orange-800 mb-3">
                  📊 Citation Authority Breakdown
                </h4>
                <div className="space-y-2">
                  {(() => {
                    // Much more granular categorization based on actual domain patterns
                    const categorizeSource = (domain: string) => {
                      const d = domain.toLowerCase();

                      // Government & Academic (highest authority)
                      if (
                        d.includes(".gov") ||
                        d.includes(".mil") ||
                        d.endsWith(".gov")
                      )
                        return "Government";
                      if (
                        d.includes(".edu") ||
                        d.includes("university") ||
                        d.includes("college") ||
                        d.includes("harvard") ||
                        d.includes("stanford") ||
                        d.includes("mit.edu")
                      )
                        return "Academic";

                      // News & Media (credible journalism)
                      if (
                        d.includes("reuters") ||
                        d.includes("bloomberg") ||
                        d.includes("wsj") ||
                        d.includes("ft.com") ||
                        d.includes("cnbc") ||
                        d.includes("economist") ||
                        d.includes("guardian") ||
                        d.includes("nytimes") ||
                        d.includes("washingtonpost")
                      )
                        return "Financial News";
                      if (
                        d.includes("bbc") ||
                        d.includes("cnn") ||
                        d.includes("npr") ||
                        d.includes("apnews") ||
                        d.includes("axios") ||
                        d.includes("politico")
                      )
                        return "Mainstream News";
                      if (
                        d.includes("techcrunch") ||
                        d.includes("wired") ||
                        d.includes("ars-technica") ||
                        d.includes("venturebeat") ||
                        d.includes("theverge")
                      )
                        return "Tech Media";

                      // Industry Authority (business thought leadership)
                      if (
                        d.includes("mckinsey") ||
                        d.includes("bcg") ||
                        d.includes("bain") ||
                        d.includes("kpmg") ||
                        d.includes("deloitte") ||
                        d.includes("pwc") ||
                        d.includes("ey.com")
                      )
                        return "Management Consulting";
                      if (
                        d.includes("kornferry") ||
                        d.includes("russell") ||
                        d.includes("egon") ||
                        d.includes("heidrick") ||
                        d.includes("spencer") ||
                        d.includes("exec") ||
                        d.includes("talent")
                      )
                        return "Executive Search";
                      if (
                        d.includes("forbes") ||
                        d.includes("fortune") ||
                        d.includes("inc.com") ||
                        d.includes("entrepreneur") ||
                        d.includes("fastcompany") ||
                        d.includes("hbr.org") ||
                        d.includes("strategy")
                      )
                        return "Business Media";

                      // Reference & Knowledge
                      if (
                        d.includes("wikipedia") ||
                        d.includes("britannica") ||
                        d.includes("investopedia") ||
                        d.includes("dictionary")
                      )
                        return "Reference";

                      // Professional Networks
                      if (
                        d.includes("linkedin") ||
                        d.includes("glassdoor") ||
                        d.includes("indeed") ||
                        d.includes("monster")
                      )
                        return "Professional Networks";

                      // Social & Community
                      if (
                        d.includes("twitter") ||
                        d.includes("facebook") ||
                        d.includes("reddit") ||
                        d.includes("quora") ||
                        d.includes("stackexchange")
                      )
                        return "Social Platforms";

                      // Content Platforms
                      if (
                        d.includes("medium") ||
                        d.includes("substack") ||
                        d.includes("blog") ||
                        d.includes("wordpress") ||
                        d.includes("blogger")
                      )
                        return "Blog Platforms";

                      // Software/SaaS companies
                      if (
                        d.includes("salesforce") ||
                        d.includes("microsoft") ||
                        d.includes("google") ||
                        d.includes("amazon") ||
                        d.includes("oracle") ||
                        d.includes("sap") ||
                        d.includes("adobe")
                      )
                        return "Tech Giants";

                      // Industry associations & organizations
                      if (
                        d.includes("institute") ||
                        d.includes("association") ||
                        d.includes("society") ||
                        d.includes("foundation") ||
                        d.includes("council") ||
                        d.includes(".org")
                      )
                        return "Industry Organizations";

                      // Everything else gets categorized by TLD or domain pattern
                      if (d.includes(".com") && !d.includes("www.")) {
                        // Try to identify specific industry patterns
                        if (
                          d.includes("hr") ||
                          d.includes("talent") ||
                          d.includes("people") ||
                          d.includes("workforce")
                        )
                          return "HR/Talent";
                        if (
                          d.includes("finance") ||
                          d.includes("capital") ||
                          d.includes("investment") ||
                          d.includes("fund")
                        )
                          return "Financial Services";
                        if (
                          d.includes("law") ||
                          d.includes("legal") ||
                          d.includes("attorney")
                        )
                          return "Legal";
                        if (
                          d.includes("health") ||
                          d.includes("medical") ||
                          d.includes("pharma")
                        )
                          return "Healthcare";
                        return "Corporate Websites";
                      }

                      return "Other";
                    };

                    const categories = bundle.sources.reduce(
                      (acc: any, source: any) => {
                        const category = categorizeSource(source.domain);
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      },
                      {}
                    );

                    const sortedCategories = Object.entries(categories)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 6);

                    const getColorClass = (category: string) => {
                      switch (category) {
                        case "Government":
                          return "bg-green-600";
                        case "Academic":
                          return "bg-green-500";
                        case "Management Consulting":
                          return "bg-blue-600";
                        case "Executive Search":
                          return "bg-blue-500";
                        case "Business Media":
                          return "bg-purple-600";
                        case "Financial News":
                          return "bg-purple-500";
                        case "Mainstream News":
                          return "bg-red-500";
                        case "Tech Media":
                          return "bg-cyan-500";
                        case "Tech Giants":
                          return "bg-indigo-600";
                        case "Reference":
                          return "bg-yellow-500";
                        case "Professional Networks":
                          return "bg-orange-600";
                        case "Social Platforms":
                          return "bg-orange-400";
                        case "Blog Platforms":
                          return "bg-pink-500";
                        case "Industry Organizations":
                          return "bg-emerald-500";
                        case "HR/Talent":
                          return "bg-teal-500";
                        case "Financial Services":
                          return "bg-slate-600";
                        case "Legal":
                          return "bg-amber-600";
                        case "Healthcare":
                          return "bg-rose-500";
                        case "Corporate Websites":
                          return "bg-gray-500";
                        default:
                          return "bg-gray-400";
                      }
                    };

                    return sortedCategories.map(([category, count], i) => {
                      const percentage = Math.round(
                        ((count as number) / bundle.sources.length) * 100
                      );

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-orange-900">
                            {category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-orange-700">
                              {count as number}
                            </span>
                            <div className="w-16 bg-orange-100 rounded-full h-2">
                              <div
                                className={`${getColorClass(
                                  category
                                )} h-2 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-orange-700 w-8">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-3 p-2 bg-orange-100 rounded text-xs text-orange-700">
                  <span className="font-medium">💡 Marketing Insight:</span>{" "}
                  {(() => {
                    // Recalculate categories for the insight
                    const categorizeSource = (domain: string) => {
                      const d = domain.toLowerCase();
                      if (
                        d.includes(".gov") ||
                        d.includes(".mil") ||
                        d.endsWith(".gov")
                      )
                        return "Government";
                      if (
                        d.includes(".edu") ||
                        d.includes("university") ||
                        d.includes("college") ||
                        d.includes("harvard") ||
                        d.includes("stanford") ||
                        d.includes("mit.edu")
                      )
                        return "Academic";
                      if (
                        d.includes("mckinsey") ||
                        d.includes("bcg") ||
                        d.includes("bain") ||
                        d.includes("kpmg") ||
                        d.includes("deloitte") ||
                        d.includes("pwc") ||
                        d.includes("ey.com")
                      )
                        return "Management Consulting";
                      if (
                        d.includes("kornferry") ||
                        d.includes("russell") ||
                        d.includes("egon") ||
                        d.includes("heidrick") ||
                        d.includes("spencer") ||
                        d.includes("exec") ||
                        d.includes("talent")
                      )
                        return "Executive Search";
                      if (
                        d.includes("forbes") ||
                        d.includes("fortune") ||
                        d.includes("inc.com") ||
                        d.includes("entrepreneur") ||
                        d.includes("fastcompany") ||
                        d.includes("hbr.org") ||
                        d.includes("strategy")
                      )
                        return "Business Media";
                      if (
                        d.includes("reuters") ||
                        d.includes("bloomberg") ||
                        d.includes("wsj") ||
                        d.includes("ft.com") ||
                        d.includes("cnbc") ||
                        d.includes("economist") ||
                        d.includes("guardian") ||
                        d.includes("nytimes") ||
                        d.includes("washingtonpost")
                      )
                        return "Financial News";
                      if (
                        d.includes("techcrunch") ||
                        d.includes("wired") ||
                        d.includes("ars-technica") ||
                        d.includes("venturebeat") ||
                        d.includes("theverge")
                      )
                        return "Tech Media";
                      if (
                        d.includes("salesforce") ||
                        d.includes("microsoft") ||
                        d.includes("google") ||
                        d.includes("amazon") ||
                        d.includes("oracle") ||
                        d.includes("sap") ||
                        d.includes("adobe")
                      )
                        return "Tech Giants";
                      if (
                        d.includes("linkedin") ||
                        d.includes("glassdoor") ||
                        d.includes("indeed") ||
                        d.includes("monster")
                      )
                        return "Professional Networks";
                      if (
                        d.includes("twitter") ||
                        d.includes("facebook") ||
                        d.includes("reddit") ||
                        d.includes("quora") ||
                        d.includes("stackexchange")
                      )
                        return "Social Platforms";
                      if (
                        d.includes("medium") ||
                        d.includes("substack") ||
                        d.includes("blog") ||
                        d.includes("wordpress") ||
                        d.includes("blogger")
                      )
                        return "Blog Platforms";
                      if (
                        d.includes("institute") ||
                        d.includes("association") ||
                        d.includes("society") ||
                        d.includes("foundation") ||
                        d.includes("council") ||
                        d.includes(".org")
                      )
                        return "Industry Organizations";
                      return "Corporate Websites";
                    };

                    const insightCategories = bundle.sources.reduce(
                      (acc: any, source: any) => {
                        const category = categorizeSource(source.domain);
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      },
                      {}
                    );

                    const topCategory = Object.entries(insightCategories).sort(
                      ([, a], [, b]) => (b as number) - (a as number)
                    )[0];

                    if (!topCategory) return "No sources to analyze";

                    const topCategoryName = topCategory[0];
                    const topCategoryPercent = Math.round(
                      ((topCategory[1] as number) / bundle.sources.length) * 100
                    );

                    if (
                      topCategoryName === "Government" ||
                      topCategoryName === "Academic"
                    ) {
                      return `${topCategoryPercent}% authoritative sources - build credibility through official partnerships`;
                    } else if (
                      topCategoryName === "Management Consulting" ||
                      topCategoryName === "Executive Search"
                    ) {
                      return `${topCategoryPercent}% from consulting - establish thought leadership in your industry`;
                    } else if (
                      topCategoryName === "Business Media" ||
                      topCategoryName === "Financial News"
                    ) {
                      return `${topCategoryPercent}% media coverage - focus on newsworthy content and PR`;
                    } else if (
                      topCategoryName === "Tech Giants" ||
                      topCategoryName === "Tech Media"
                    ) {
                      return `${topCategoryPercent}% tech-focused - create technical content and product insights`;
                    } else if (
                      topCategoryName === "Professional Networks" ||
                      topCategoryName === "Social Platforms"
                    ) {
                      return `${topCategoryPercent}% social/professional - leverage LinkedIn and industry networks`;
                    } else if (topCategoryName === "Blog Platforms") {
                      return `${topCategoryPercent}% from blogs - opportunity to compete with quality content`;
                    } else if (topCategoryName === "Industry Organizations") {
                      return `${topCategoryPercent}% industry bodies - join associations and publish white papers`;
                    } else {
                      return `Diverse mix across ${
                        Object.keys(insightCategories).length
                      } categories - multi-channel content strategy needed`;
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Search Mechanism Analysis */}
        {analysisData.ai_search_intelligence && (
          <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-3">
              What Types of Sources Does AI Search Prefer?
            </h4>
            <p className="text-sm text-purple-700 mb-3">
              Analysis of which source types and content characteristics AI
              search engines are most likely to select and cite.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-purple-700 mb-2">
                  Preferred Source Types
                </h5>
                <div className="space-y-1">
                  {(
                    analysisData.ai_search_intelligence.selection_patterns
                      ?.preferred_source_types || []
                  ).map((type: string, i: number) => (
                    <div key={i} className="text-purple-600">
                      • {type}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-purple-700 mb-2">
                  Success Factors
                </h5>
                <div className="space-y-1">
                  {(
                    analysisData.ai_search_intelligence.selection_patterns
                      ?.citation_success_factors || []
                  ).map((factor: string, i: number) => (
                    <div key={i} className="text-purple-600">
                      • {factor}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Strategy Intelligence */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-green-900 mb-1">
            Content Strategy Intelligence
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Actionable insights for your content roadmap
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="text-lg font-semibold text-green-800 mb-3">
                💡 Content Gap Analysis
              </h4>
              {bundle.sources?.length > 0 ? (
                <div className="space-y-3 text-sm">
                  <div className="bg-green-100 rounded p-3">
                    <p className="font-medium text-green-800">
                      Competition Level:{" "}
                      {bundle.sources.length < 3
                        ? "LOW 🟢"
                        : bundle.sources.length < 8
                        ? "MEDIUM 🟡"
                        : "HIGH 🔴"}
                    </p>
                    <p className="text-green-700 mt-1">
                      {bundle.sources.length < 3
                        ? "Excellent opportunity to dominate with quality content"
                        : bundle.sources.length < 8
                        ? "Moderate competition - focus on unique angles"
                        : "Saturated space - need exceptional content to compete"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">
                      Publisher Diversity
                    </p>
                    <p className="text-green-700">
                      {new Set(bundle.sources.map((s: any) => s.domain)).size}{" "}
                      unique domains publishing on this topic
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-100 rounded p-3">
                  <p className="font-medium text-yellow-800">
                    🚀 First-Mover Opportunity
                  </p>
                  <p className="text-yellow-700">
                    No strong sources found - potential to be the authoritative
                    voice on this topic
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="text-lg font-semibold text-green-800 mb-3">
                📝 Format Recommendations
              </h4>
              <div className="space-y-2 text-sm">
                {bundle.sources?.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-green-800">
                        Comprehensive Guides
                      </span>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        High Impact
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-green-800">Data Analysis</span>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        High Impact
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-green-800">Case Studies</span>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Medium Impact
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-green-800">Industry Reports</span>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Medium Impact
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-green-700">
                    <p>• Authoritative overview content</p>
                    <p>• Data-driven analysis</p>
                    <p>• Industry best practices</p>
                    <p>• Expert interviews</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Immediate Action Plan */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-blue-900 mb-1">
            Immediate Action Plan
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Your roadmap to AI search visibility
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 mb-3">
                🎯 This Quarter's Priorities
              </h4>
              <div className="space-y-3">
                {bundle.sources?.length === 0 ? (
                  <>
                    <div className="bg-blue-100 rounded p-3">
                      <p className="font-medium text-blue-800">
                        1. Create Foundational Content
                      </p>
                      <p className="text-blue-700 text-sm mt-1">
                        Be the first authoritative source on this topic
                      </p>
                      <div className="text-xs text-blue-600 mt-2">
                        Priority: HIGH • Timeline: 4-6 weeks
                      </div>
                    </div>
                    <div className="bg-blue-100 rounded p-3">
                      <p className="font-medium text-blue-800">
                        2. Optimize for AI Discovery
                      </p>
                      <p className="text-blue-700 text-sm mt-1">
                        Structure content for AI comprehension
                      </p>
                      <div className="text-xs text-blue-600 mt-2">
                        Priority: HIGH • Timeline: 2-3 weeks
                      </div>
                    </div>
                  </>
                ) : bundle.sources.length < 5 ? (
                  <>
                    <div className="bg-blue-100 rounded p-3">
                      <p className="font-medium text-blue-800">
                        1. Competitive Analysis
                      </p>
                      <p className="text-blue-700 text-sm mt-1">
                        Study top-ranking content gaps
                      </p>
                      <div className="text-xs text-blue-600 mt-2">
                        Priority: HIGH • Timeline: 1-2 weeks
                      </div>
                    </div>
                    <div className="bg-blue-100 rounded p-3">
                      <p className="font-medium text-blue-800">
                        2. Create Superior Content
                      </p>
                      <p className="text-blue-700 text-sm mt-1">
                        Outperform existing sources
                      </p>
                      <div className="text-xs text-blue-600 mt-2">
                        Priority: HIGH • Timeline: 4-8 weeks
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-100 rounded p-3">
                      <p className="font-medium text-blue-800">
                        1. Find Unique Angles
                      </p>
                      <p className="text-blue-700 text-sm mt-1">
                        Highly competitive - need differentiation
                      </p>
                      <div className="text-xs text-blue-600 mt-2">
                        Priority: HIGH • Timeline: 2-3 weeks
                      </div>
                    </div>
                    <div className="bg-blue-100 rounded p-3">
                      <p className="font-medium text-blue-800">
                        2. Partner Strategy
                      </p>
                      <p className="text-blue-700 text-sm mt-1">
                        Collaborate with authority domains
                      </p>
                      <div className="text-xs text-blue-600 mt-2">
                        Priority: MEDIUM • Timeline: 6-12 weeks
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 mb-3">
                📊 Success Metrics
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-blue-800">
                    Track AI Citations
                  </p>
                  <p className="text-blue-700">
                    Monitor mentions in AI search results
                  </p>
                </div>
                <div>
                  <p className="font-medium text-blue-800">
                    Content Performance
                  </p>
                  <p className="text-blue-700">
                    Measure engagement and authority signals
                  </p>
                </div>
                <div>
                  <p className="font-medium text-blue-800">
                    Competitive Position
                  </p>
                  <p className="text-blue-700">
                    Track ranking vs. competitor content
                  </p>
                </div>
                <div className="bg-blue-100 rounded p-2 mt-3">
                  <p className="text-xs font-medium text-blue-800">
                    💡 Pro Tip
                  </p>
                  <p className="text-xs text-blue-700">
                    Run this analysis monthly to track progress and identify new
                    opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competitive Landscape */}
        {analysisData.ai_search_intelligence?.competitive_landscape && (
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-3">
              Who's Winning AI Search and Why?
            </h4>
            <p className="text-sm text-orange-700 mb-3">
              Analysis of which publishers are most successful at getting cited
              by AI, and what strategies they use.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-orange-700 mb-2">
                  Winning Publishers
                </h5>
                <div className="space-y-2">
                  {(analysisData.visibility_intelligence?.winning_domains || [])
                    .slice(0, 5)
                    .map((winner: any, i: number) => (
                      <div key={i} className="bg-white border rounded p-2">
                        <div className="font-medium text-orange-900">
                          {winner.domain}
                        </div>
                        <div className="text-xs text-orange-600">
                          {winner.citations} citations ·{" "}
                          {winner.success_factors?.join(", ")}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-orange-700 mb-2">
                  Market Gaps
                </h5>
                <div className="space-y-1">
                  {(
                    analysisData.ai_search_intelligence.competitive_landscape
                      .market_gaps || []
                  ).map((gap: string, i: number) => (
                    <div key={i} className="text-orange-600">
                      • {gap}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Selection Performance by Type */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">
            Which Source Types Have the Best AI Selection Rates?
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            Data showing which types of content sources are most likely to be
            selected and cited by AI search engines.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">
                High Performing Types
              </h5>
              <div className="space-y-1">
                {(
                  analysisData.mechanism_insights?.content_performance
                    ?.high_performing_types || []
                ).map((type: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">
                      {type.type}
                    </span>
                    <span className="font-medium text-green-600">
                      {Math.round(type.citation_rate * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">
                Source Type Breakdown
              </h5>
              <div className="space-y-1">
                {Object.entries(analysisData.source_breakdown?.by_type || {})
                  .filter(([_, v]) => (v as number) > 0)
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600 capitalize">{type}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">
            Complete Source Analysis - What AI Actually Selected
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            Full breakdown of every source that was cited by AI for this query,
            showing the exact characteristics that led to selection.
          </p>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Title</th>
                  <th className="px-2 py-1">Domain</th>
                  <th className="px-2 py-1">Type</th>
                  <th className="px-2 py-1">Cred</th>
                  <th className="px-2 py-1">Link</th>
                </tr>
              </thead>
              <tbody>
                {(bundle.sources || []).map((s: any, i: number) => (
                  <tr key={s.source_id} className="border-t">
                    <td className="px-2 py-1 align-top">{i + 1}</td>
                    <td className="px-2 py-1 align-top">{s.title || s.url}</td>
                    <td className="px-2 py-1 align-top">{s.domain}</td>
                    <td className="px-2 py-1 align-top">
                      {s.media_type || "-"}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {(s.credibility?.band || "").toString()}
                    </td>
                    <td className="px-2 py-1 align-top">
                      <a className="underline" href={s.url} target="_blank">
                        open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {analysisData.panels?.notable_citations?.length > 0 && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-3">
              Gold Standard Sources - What AI Considers Most Authoritative
            </h4>
            <p className="text-sm text-yellow-700 mb-3">
              The highest-quality sources identified by AI search, showing what
              characteristics make content most trustworthy.
            </p>
            <div className="space-y-2 text-sm">
              {analysisData.panels.notable_citations.map(
                (citation: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 text-xs mt-1">🏆</span>
                    <span className="text-yellow-700">{citation.reason}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Strategic Intelligence Summary */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-6">
          <h4 className="text-xl font-bold text-slate-800 mb-4">
            🎯 Strategic Intelligence Summary
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risks */}
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <h5 className="font-semibold text-red-800 mb-3 flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                Content Strategy Risks
              </h5>
              <ul className="space-y-2 text-sm">
                {(() => {
                  const risks = [];
                  const sourceCount = bundle.sources?.length || 0;
                  const domainCount = new Set(
                    bundle.sources?.map((s: any) => s.domain) || []
                  ).size;
                  const citationRate =
                    sourceCount > 0
                      ? Math.round(
                          ((bundle.evidence?.length || 0) / sourceCount) * 100
                        )
                      : 0;

                  if (sourceCount === 0) {
                    risks.push(
                      "No AI citations found - you're invisible in AI search"
                    );
                    risks.push(
                      "First-mover advantage available but requires immediate action"
                    );
                  } else if (sourceCount < 3) {
                    risks.push(
                      "Very low competition - window may close quickly"
                    );
                    risks.push(
                      "Limited examples to learn from - higher execution risk"
                    );
                  } else if (sourceCount > 15) {
                    risks.push(
                      "Highly saturated market - difficult to break through"
                    );
                    risks.push(
                      "Established players dominate - need exceptional differentiation"
                    );
                  }

                  if (citationRate < 30) {
                    risks.push(
                      "Low citation rate suggests content quality issues"
                    );
                  }

                  if (domainCount < 3) {
                    risks.push("Limited publisher diversity - dependency risk");
                  }

                  if (risks.length === 0) {
                    risks.push("Moderate competition with good opportunities");
                  }

                  return risks.slice(0, 4).map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 text-xs mt-1">•</span>
                      <span className="text-red-700">{risk}</span>
                    </li>
                  ));
                })()}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h5 className="font-semibold text-green-800 mb-3 flex items-center">
                <span className="text-green-500 mr-2">💡</span>
                Strategic Opportunities
              </h5>
              <ul className="space-y-2 text-sm">
                {(() => {
                  const opportunities = [];
                  const sourceCount = bundle.sources?.length || 0;
                  const domainCount = new Set(
                    bundle.sources?.map((s: any) => s.domain) || []
                  ).size;

                  // Analyze source types for opportunities
                  const categorizeSource = (domain: string) => {
                    const d = domain.toLowerCase();
                    if (d.includes(".gov") || d.includes(".edu"))
                      return "authority";
                    if (
                      d.includes("forbes") ||
                      d.includes("mckinsey") ||
                      d.includes("kornferry")
                    )
                      return "industry";
                    if (d.includes("blog") || d.includes("medium"))
                      return "blog";
                    return "corporate";
                  };

                  const categories =
                    bundle.sources?.reduce((acc: any, source: any) => {
                      const cat = categorizeSource(source.domain);
                      acc[cat] = (acc[cat] || 0) + 1;
                      return acc;
                    }, {}) || {};

                  if (sourceCount === 0) {
                    opportunities.push(
                      "Blue ocean opportunity - be the first authoritative voice"
                    );
                    opportunities.push(
                      "Define the conversation and set industry standards"
                    );
                  } else if (sourceCount < 5) {
                    opportunities.push(
                      "Low competition - excellent opportunity to dominate"
                    );
                    opportunities.push(
                      "High potential for thought leadership positioning"
                    );
                  }

                  if (!categories.authority) {
                    opportunities.push(
                      "No government/academic sources - partner opportunity"
                    );
                  }

                  if (!categories.industry || categories.industry < 2) {
                    opportunities.push(
                      "Limited industry expert presence - establish authority"
                    );
                  }

                  if (domainCount > 5) {
                    opportunities.push(
                      "Diverse landscape - multiple partnership options"
                    );
                  }

                  if (categories.blog > categories.industry) {
                    opportunities.push(
                      "Blog-heavy space - professional content will stand out"
                    );
                  }

                  if (opportunities.length === 0) {
                    opportunities.push(
                      "Balanced competitive landscape with room for growth"
                    );
                  }

                  return opportunities.slice(0, 4).map((opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 text-xs mt-1">•</span>
                      <span className="text-green-700">{opp}</span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </div>

          {/* Action Priority */}
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              🚀 Immediate Priority:{" "}
              {bundle.sources?.length === 0
                ? "Create foundational content immediately - first-mover advantage available"
                : bundle.sources?.length < 5
                ? "Scale content production while competition is low"
                : bundle.sources?.length > 15
                ? "Focus on unique angles and exceptional quality to break through"
                : "Build consistent content presence and establish thought leadership"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
        onClick={async () => {
          setOpen(true);

          // Check if we already have analysis data for this run
          const runId = bundle.run?.run_id;
          if (analysisData && runId) {
            console.log("[FRONTEND CACHE] Using existing analysis data");
            return; // Already have data, don't fetch again
          }

          // Send existing bundle data - no need to re-fetch from store!
          try {
            setGenerating(true);
            console.log("[FRONTEND] Fetching new analysis data...");
            const startTime = performance.now();

            const analysisRes = await fetch(
              `${apiBaseUrl}/api/runs/${runId}/llm_citation_analysis`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bundle),
                cache: "no-store",
              }
            );
            const analysisJson = await analysisRes.json();

            const fetchTime = performance.now() - startTime;
            console.log(
              `[FRONTEND] Analysis fetch took ${fetchTime.toFixed(0)}ms`
            );

            if (analysisJson && analysisJson.ok !== false) {
              setAnalysisData(analysisJson);
            } else {
              console.error("LLM analysis failed:", analysisJson);
              // Fallback to empty analysis
              setAnalysisData({});
            }
          } catch (error) {
            console.error("Failed to generate report:", error);
            setAnalysisData({});
          } finally {
            setGenerating(false);
          }
        }}
      >
        AI Search Intelligence
      </button>
      <Modal
        open={open}
        title="AI Search Mechanism Analysis"
        onClose={() => setOpen(false)}
      >
        <div className="prose max-w-none">
          {/* Export menu (compact) */}
          <div className="flex items-center justify-end mb-3 gap-2 not-prose">
            <details className="relative">
              <summary className="list-none cursor-pointer inline-flex items-center gap-2 px-3 py-1 border rounded text-sm bg-white">
                Export
              </summary>
              <div className="absolute right-0 mt-1 w-56 bg-white border rounded shadow p-2 z-10">
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm"
                  onClick={() => download("answer.md", answerMarkdown(bundle))}
                >
                  Download Answer.md
                </button>
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm"
                  onClick={() =>
                    download("sources.csv", sourcesCSV(bundle), "text/csv")
                  }
                >
                  Download sources.csv
                </button>
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm"
                  onClick={() =>
                    download(
                      "sources.json",
                      sourcesJSON(bundle),
                      "application/json"
                    )
                  }
                >
                  Download sources.json
                </button>
                {reportMd && (
                  <button
                    className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm"
                    onClick={() => download("report.md", reportMd)}
                  >
                    Download report.md
                  </button>
                )}
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm"
                  onClick={() =>
                    download("methods.md", methodsMarkdown(bundle))
                  }
                >
                  Download methods.md
                </button>
              </div>
            </details>
          </div>

          {renderModalBody()}
        </div>
        {/* Downloads removed from footer; use Export menu */}
      </Modal>
    </>
  );
}

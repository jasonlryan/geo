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
import Card, { CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import KPICard from "@/components/ui/KPICard";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

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

  const generatePDF = async () => {
    if (!analysisData) return;

    try {
      // Use browser's print to PDF functionality
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      // Generate the report content as clean HTML
      const reportTitle = `AI Search Intelligence Report - ${bundle.run?.subject || "Analysis"}`;
      const reportDate = new Date().toLocaleDateString();
      const query = bundle.run?.query || "";
      const subject = bundle.run?.subject || "Not specified";

      // Calculate key metrics
      const sourceCount = bundle.sources?.length || 0;
      const citedCount = bundle.evidence?.length || 0;
      const citationRate =
        sourceCount > 0 ? Math.round((citedCount / sourceCount) * 100) : 0;
      const uniquePublishers = new Set(
        bundle.sources?.map((s: any) => s.domain) || []
      ).size;

      // Get cited sources
      const citedSourceIds = new Set(
        bundle.evidence?.map((e: any) => e.source_id) || []
      );
      const citedSources =
        bundle.sources?.filter((s: any) => citedSourceIds.has(s.source_id)) ||
        [];

      // Source categorization for insights
      const categorizeSource = (domain: string) => {
        const d = domain.toLowerCase();
        if (d.includes(".gov") || d.includes(".mil")) return "Government";
        if (
          d.includes(".edu") ||
          d.includes("university") ||
          d.includes("college")
        )
          return "Academic";
        if (d.includes("mckinsey") || d.includes("bcg") || d.includes("bain"))
          return "Management Consulting";
        if (
          d.includes("kornferry") ||
          d.includes("russell") ||
          d.includes("egon")
        )
          return "Executive Search";
        if (
          d.includes("forbes") ||
          d.includes("fortune") ||
          d.includes("hbr.org")
        )
          return "Business Media";
        if (
          d.includes("reuters") ||
          d.includes("bloomberg") ||
          d.includes("wsj")
        )
          return "Financial News";
        if (
          d.includes("techcrunch") ||
          d.includes("wired") ||
          d.includes("theverge")
        )
          return "Tech Media";
        return "Corporate Websites";
      };

      const sourceCategories =
        bundle.sources?.reduce((acc: any, source: any) => {
          const category = categorizeSource(source.domain);
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}) || {};

      const topCategory = Object.entries(sourceCategories).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${reportTitle}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #1f2937;
            background: white;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #3b82f6;
        }
        .header h1 { 
            color: #1e40af; 
            margin: 0 0 10px 0; 
            font-size: 28px;
        }
        .header .date { 
            color: #6b7280; 
            font-size: 14px;
        }
        .context-box {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .context-box h3 {
            color: #0f172a;
            margin-top: 0;
            font-size: 18px;
        }
        .kpi-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin: 20px 0;
        }
        .kpi-card { 
            background: #f1f5f9; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px;
            border: 2px solid #cbd5e1;
        }
        .kpi-value { 
            font-size: 32px; 
            font-weight: bold; 
            margin: 10px 0;
        }
        .kpi-label { 
            color: #64748b; 
            font-size: 14px;
        }
        .blue { color: #3b82f6; }
        .green { color: #10b981; }
        .orange { color: #f59e0b; }
        .purple { color: #8b5cf6; }
        .section { 
            margin: 30px 0; 
            page-break-inside: avoid;
        }
        .section h2 { 
            color: #1e40af; 
            border-bottom: 2px solid #3b82f6; 
            padding-bottom: 10px;
            font-size: 20px;
        }
        .citation-list { 
            background: #fef7e3; 
            border: 2px solid #fbbf24; 
            border-radius: 8px; 
            padding: 20px;
        }
        .citation-item { 
            margin: 15px 0; 
            padding: 15px; 
            background: white; 
            border-radius: 6px;
            border: 1px solid #fbbf24;
        }
        .citation-title { 
            font-weight: bold; 
            color: #92400e;
            margin-bottom: 5px;
        }
        .citation-domain { 
            color: #d97706; 
            font-size: 12px;
        }
        .insight-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .insight-card {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            border-radius: 8px;
            padding: 20px;
        }
        .insight-card h4 {
            color: #166534;
            margin-top: 0;
            font-size: 16px;
        }
        .category-breakdown {
            background: #fdf2f8;
            border: 2px solid #f9a8d4;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #f9a8d4;
        }
        .category-name {
            font-weight: 500;
            color: #be185d;
        }
        .category-count {
            background: #be185d;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        .action-plan {
            background: #eff6ff;
            border: 2px solid #93c5fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .action-item {
            background: white;
            margin: 15px 0;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
        }
        .action-title {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .action-desc {
            color: #1e40af;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .action-meta {
            color: #3b82f6;
            font-size: 12px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        .risk-card {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
        }
        .opportunity-card {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            border-radius: 8px;
            padding: 20px;
        }
        .priority-box {
            background: #eff6ff;
            border: 2px solid #60a5fa;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        ul { list-style-type: disc; margin-left: 20px; }
        li { margin: 8px 0; }
        @page { 
            margin: 1in; 
            @bottom-center { 
                content: "AI Search Intelligence Report - Page " counter(page);
                font-size: 10px;
                color: #6b7280;
            }
        }
        @media print {
            body { margin: 0; }
            .kpi-grid { grid-template-columns: repeat(2, 1fr); }
            .insight-grid { grid-template-columns: 1fr; }
            .summary-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportTitle}</h1>
        <div class="date">Generated ${reportDate}</div>
    </div>

    <div class="context-box">
        <h3>Intelligence Report Context</h3>
        <div><strong>Subject:</strong> ${subject}</div>
        <div><strong>Query:</strong> ${query}</div>
        <div><strong>AI Search Funnel:</strong> ${sourceCount} sources → ${citedCount} cited (${citationRate}% rate)</div>
    </div>

    <div class="section">
        <h2>Performance Overview</h2>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value blue">${sourceCount}</div>
                <div class="kpi-label">Sources AI Found</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value green">${uniquePublishers}</div>
                <div class="kpi-label">Unique Publishers</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value orange">${citedCount}</div>
                <div class="kpi-label">Sources Cited</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value purple">${citationRate}%</div>
                <div class="kpi-label">Citation Rate</div>
            </div>
        </div>
    </div>

    ${
      citedSources.length > 0
        ? `
    <div class="section">
        <h2>Who Actually Gets Cited?</h2>
        <div class="citation-list">
            ${citedSources
              .slice(0, 8)
              .map((source: any, i: number) => {
                const citationCount =
                  bundle.evidence?.filter(
                    (e: any) => e.source_id === source.source_id
                  ).length || 0;
                return `
                <div class="citation-item">
                    <div class="citation-title">#${i + 1}: ${source.title || source.url}</div>
                    <div class="citation-domain">${source.domain} • ${citationCount} citation${citationCount !== 1 ? "s" : ""}</div>
                </div>
              `;
              })
              .join("")}
        </div>
    </div>
    `
        : ""
    }

    ${
      Object.keys(sourceCategories).length > 0
        ? `
    <div class="section">
        <h2>Source Type Analysis</h2>
        <div class="category-breakdown">
            <h4>Citation Authority Breakdown</h4>
            ${Object.entries(sourceCategories)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 8)
              .map(([category, count]) => {
                const percentage = Math.round(
                  ((count as number) / sourceCount) * 100
                );
                return `
                  <div class="category-item">
                      <span class="category-name">${category}</span>
                      <span class="category-count">${count} (${percentage}%)</span>
                  </div>
                `;
              })
              .join("")}
            ${
              topCategory
                ? `
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px;">
                <strong>💡 Marketing Insight:</strong> 
                ${(() => {
                  const topCategoryName = topCategory[0];
                  const topCategoryPercent = Math.round(
                    ((topCategory[1] as number) / sourceCount) * 100
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
                  } else {
                    return `Diverse mix across ${Object.keys(sourceCategories).length} categories - multi-channel content strategy needed`;
                  }
                })()}
            </div>
            `
                : ""
            }
        </div>
    </div>
    `
        : ""
    }

    <div class="section">
        <h2>Strategic Intelligence & Action Plan</h2>
        <div class="insight-grid">
            <div class="insight-card">
                <h4>💡 Content Gap Analysis</h4>
                ${
                  sourceCount === 0
                    ? `
                    <div style="background: #fef3c7; padding: 15px; border-radius: 6px;">
                        <strong>🚀 First-Mover Opportunity</strong><br>
                        No strong sources found - potential to be the authoritative voice on this topic
                    </div>
                `
                    : `
                    <div style="background: #d1fae5; padding: 15px; border-radius: 6px;">
                        <strong>Competition Level: ${sourceCount < 3 ? "LOW 🟢" : sourceCount < 8 ? "MEDIUM 🟡" : "HIGH 🔴"}</strong><br>
                        ${
                          sourceCount < 3
                            ? "Excellent opportunity to dominate with quality content"
                            : sourceCount < 8
                              ? "Moderate competition - focus on unique angles"
                              : "Saturated space - need exceptional content to compete"
                        }
                    </div>
                `
                }
                <div style="margin-top: 10px;">
                    <strong>Publisher Diversity:</strong> ${uniquePublishers} unique domains publishing on this topic
                </div>
            </div>
            <div class="insight-card">
                <h4>📝 Format Recommendations</h4>
                <ul>
                    <li>Comprehensive Guides - <strong>High Impact</strong></li>
                    <li>Data Analysis - <strong>High Impact</strong></li>
                    <li>Case Studies - <strong>Medium Impact</strong></li>
                    <li>Industry Reports - <strong>Medium Impact</strong></li>
                </ul>
            </div>
        </div>

        <div class="action-plan">
            <h4 style="color: #1e40af; margin-top: 0;">🎯 This Quarter's Priorities</h4>
            ${
              sourceCount === 0
                ? `
                <div class="action-item">
                    <div class="action-title">1. Create Foundational Content</div>
                    <div class="action-desc">Be the first authoritative source on this topic</div>
                    <div class="action-meta">Priority: HIGH • Timeline: 4-6 weeks</div>
                </div>
                <div class="action-item">
                    <div class="action-title">2. Optimize for AI Discovery</div>
                    <div class="action-desc">Structure content for AI comprehension</div>
                    <div class="action-meta">Priority: HIGH • Timeline: 2-3 weeks</div>
                </div>
            `
                : sourceCount < 5
                  ? `
                <div class="action-item">
                    <div class="action-title">1. Competitive Analysis</div>
                    <div class="action-desc">Study top-ranking content gaps</div>
                    <div class="action-meta">Priority: HIGH • Timeline: 1-2 weeks</div>
                </div>
                <div class="action-item">
                    <div class="action-title">2. Create Superior Content</div>
                    <div class="action-desc">Outperform existing sources</div>
                    <div class="action-meta">Priority: HIGH • Timeline: 4-8 weeks</div>
                </div>
            `
                  : `
                <div class="action-item">
                    <div class="action-title">1. Find Unique Angles</div>
                    <div class="action-desc">Highly competitive - need differentiation</div>
                    <div class="action-meta">Priority: HIGH • Timeline: 2-3 weeks</div>
                </div>
                <div class="action-item">
                    <div class="action-title">2. Partner Strategy</div>
                    <div class="action-desc">Collaborate with authority domains</div>
                    <div class="action-meta">Priority: MEDIUM • Timeline: 6-12 weeks</div>
                </div>
            `
            }
        </div>
    </div>

    <div class="section">
        <h2>Strategic Summary</h2>
        <div class="summary-grid">
            <div class="risk-card">
                <h4 style="color: #dc2626; margin-top: 0;">⚠️ Content Strategy Risks</h4>
                <ul style="color: #dc2626;">
                    ${(() => {
                      const risks = [];
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
                      } else {
                        risks.push(
                          "Moderate competition with good opportunities"
                        );
                      }

                      if (citationRate < 30) {
                        risks.push(
                          "Low citation rate suggests content quality issues"
                        );
                      }

                      return risks
                        .slice(0, 4)
                        .map((risk) => `<li>${risk}</li>`)
                        .join("");
                    })()}
                </ul>
            </div>
            <div class="opportunity-card">
                <h4 style="color: #059669; margin-top: 0;">💡 Strategic Opportunities</h4>
                <ul style="color: #059669;">
                    ${(() => {
                      const opportunities = [];
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
                      } else {
                        opportunities.push(
                          "Balanced competitive landscape with room for growth"
                        );
                      }

                      if (
                        !sourceCategories.Government &&
                        !sourceCategories.Academic
                      ) {
                        opportunities.push(
                          "No government/academic sources - partner opportunity"
                        );
                      }

                      if (uniquePublishers > 5) {
                        opportunities.push(
                          "Diverse landscape - multiple partnership options"
                        );
                      }

                      return opportunities
                        .slice(0, 4)
                        .map((opp) => `<li>${opp}</li>`)
                        .join("");
                    })()}
                </ul>
            </div>
        </div>

        <div class="priority-box">
            <strong>🚀 Immediate Priority:</strong> 
            ${
              sourceCount === 0
                ? "Create foundational content immediately - first-mover advantage available"
                : sourceCount < 5
                  ? "Scale content production while competition is low"
                  : sourceCount > 15
                    ? "Focus on unique angles and exceptional quality to break through"
                    : "Build consistent content presence and establish thought leadership"
            }
        </div>
    </div>

    <div class="section">
        <h2>Complete Source Analysis</h2>
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                        <th style="padding: 8px; text-align: left; border-right: 1px solid #cbd5e1;">#</th>
                        <th style="padding: 8px; text-align: left; border-right: 1px solid #cbd5e1;">Title</th>
                        <th style="padding: 8px; text-align: left; border-right: 1px solid #cbd5e1;">Domain</th>
                        <th style="padding: 8px; text-align: left; border-right: 1px solid #cbd5e1;">Type</th>
                        <th style="padding: 8px; text-align: left;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${(bundle.sources || [])
                      .slice(0, 20)
                      .map((s: any, i: number) => {
                        const isCited = citedSourceIds.has(s.source_id);
                        return `
                        <tr style="border-bottom: 1px solid #e2e8f0; ${isCited ? "background: #f0fdf4;" : ""}">
                            <td style="padding: 8px; border-right: 1px solid #e2e8f0;">${i + 1}</td>
                            <td style="padding: 8px; border-right: 1px solid #e2e8f0;">${(s.title || s.url).substring(0, 60)}${(s.title || s.url).length > 60 ? "..." : ""}</td>
                            <td style="padding: 8px; border-right: 1px solid #e2e8f0;">${s.domain}</td>
                            <td style="padding: 8px; border-right: 1px solid #e2e8f0;">${categorizeSource(s.domain)}</td>
                            <td style="padding: 8px; color: ${isCited ? "#059669" : "#dc2626"}; font-weight: bold;">
                                ${isCited ? "✅ CITED" : "❌ NOT CITED"}
                            </td>
                        </tr>
                      `;
                      })
                      .join("")}
                    ${
                      bundle.sources?.length > 20
                        ? `
                    <tr>
                        <td colspan="5" style="padding: 8px; text-align: center; font-style: italic; color: #6b7280;">
                            + ${bundle.sources.length - 20} more sources not shown
                        </td>
                    </tr>
                    `
                        : ""
                    }
                </tbody>
            </table>
        </div>
    </div>

    <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
        <div style="color: #6b7280; font-size: 12px;">
            This AI Search Intelligence Report was generated by analyzing real AI search behavior patterns.<br>
            Use this data to optimize your content strategy for maximum AI visibility and citation rates.
        </div>
    </div>
</body>
</html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const proposed = (bundle as any).provider_results || [];
  const fetched = (bundle as any).fetched_docs || [];

  const renderModalBody = () => {
    if (!ready) {
      return (
        <div className="flex items-center justify-center h-[70vh] text-gray-700">
          <div className="flex items-center gap-3">
            <Spinner className="h-6 w-6 text-blue-600" />
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
        {/* Query and Subject Header */}
        <Card>
          <CardHeader>
            <CardTitle>Intelligence Report Context</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <div className="text-lg font-medium text-slate-900">
                <strong>Subject:</strong>{" "}
                {bundle.run?.subject || "Not specified"}
              </div>
              <div className="text-base text-slate-700">
                <strong>Query:</strong> {bundle.run?.query}
              </div>
              <div className="text-sm text-blue-700 mt-3 pt-3 border-t">
                <strong>AI Search Funnel:</strong>{" "}
                <span className="font-mono">
                  {bundle.analysis?.funnel?.proposed ?? 0} proposed →{" "}
                  {bundle.analysis?.funnel?.fetched ?? 0} fetched →{" "}
                  {bundle.analysis?.funnel?.cited ?? 0} cited
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* AI Search Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>AI Search Performance Summary</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                label="Sources AI Found"
                value={bundle.sources?.length || 0}
              />
              <KPICard
                label="Unique Publishers"
                value={
                  new Set(bundle.sources?.map((s: any) => s.domain) || []).size
                }
              />
              <KPICard
                label="Citation Rate"
                value={`${bundle.sources?.length ? Math.round(((bundle.evidence?.length || 0) / bundle.sources.length) * 100) : 0}%`}
              />
            </div>
          </CardBody>
        </Card>

        {/* Who Actually Gets Cited */}
        {bundle.evidence?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Who Actually Gets Cited?</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-orange-700 mb-2">
                Analysis of sources that AI actually referenced in the answer
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🏆 Cited Sources Only</CardTitle>
                  </CardHeader>
                  <CardBody>
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

                        // Show individual sources, not grouped by domain
                        return citedSources
                          .slice(0, 10)
                          .map((source: any, i: number) => {
                            const citationCount =
                              bundle.evidence?.filter(
                                (e: any) => e.source_id === source.source_id
                              ).length || 0;

                            return (
                              <div
                                key={source.source_id}
                                className="py-2 border-b border-orange-100 last:border-b-0"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                    <div
                                      className="font-medium text-orange-900 text-sm line-clamp-2"
                                      title={source.title}
                                    >
                                      {source.title}
                                    </div>
                                    <div className="text-xs text-orange-600 mt-1">
                                      {source.domain} • {citationCount} citation
                                      {citationCount !== 1 ? "s" : ""}
                                    </div>
                                  </div>
                                  <div className="text-lg font-bold text-orange-500 flex-shrink-0">
                                    #{i + 1}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>📊 Citation Authority Breakdown</CardTitle>
                  </CardHeader>
                  <CardBody>
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

                        const topCategory = Object.entries(
                          insightCategories
                        ).sort(
                          ([, a], [, b]) => (b as number) - (a as number)
                        )[0];

                        if (!topCategory) return "No sources to analyze";

                        const topCategoryName = topCategory[0];
                        const topCategoryPercent = Math.round(
                          ((topCategory[1] as number) / bundle.sources.length) *
                            100
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
                        } else if (
                          topCategoryName === "Industry Organizations"
                        ) {
                          return `${topCategoryPercent}% industry bodies - join associations and publish white papers`;
                        } else {
                          return `Diverse mix across ${
                            Object.keys(insightCategories).length
                          } categories - multi-channel content strategy needed`;
                        }
                      })()}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Why These Sources Were Cited (Evidence-Driven) */}
        {(() => {
          const ev = (bundle.evidence || []) as any[];
          const sources = (bundle.sources || []) as any[];
          if (ev.length === 0 || sources.length === 0) return null;

          const citedBySource: Record<string, any[]> = {};
          for (const e of ev) {
            const sid = e.source_id;
            if (!citedBySource[sid]) citedBySource[sid] = [];
            citedBySource[sid].push(e);
          }

          const citedSources = sources.filter(
            (s) => citedBySource[s.source_id]
          );
          if (citedSources.length === 0) return null;

          const domainCounts: Record<string, number> = {};
          for (const s of citedSources) {
            domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
          }

          const toDate = (iso?: string) => {
            if (!iso) return null;
            try {
              return new Date(iso.endsWith("Z") ? iso : iso + "Z");
            } catch {
              return null;
            }
          };

          const query = (bundle.run?.query || "").toLowerCase();
          const queryTerms = Array.from(
            new Set(
              query
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter((w: string) => w.length >= 4)
            )
          ).slice(0, 6);

          const coverageMax = Math.max(
            ...citedSources.map(
              (s) => (citedBySource[s.source_id] || []).length
            )
          );

          const reasonFor = (s: any): string[] => {
            const reasons: string[] = [];
            const evid = citedBySource[s.source_id] || [];
            const coverageCount = evid.length;
            const avgScore =
              evid.reduce(
                (a: number, b: any) => a + (b.coverage_score || 0),
                0
              ) / (coverageCount || 1);
            const cred = (s.credibility || {}).score ?? 0.5;
            const published = toDate(s.published_at);
            const yearsOld = published
              ? (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24 * 365)
              : null;
            const title = (s.title || "").toLowerCase();
            const text = (s.raw_text || "").toString();

            if (coverageCount >= 2 || avgScore >= 0.7)
              reasons.push("High claim coverage");
            if (cred >= 0.8) reasons.push("Authoritative source");
            if (yearsOld !== null && yearsOld <= 3)
              reasons.push("Fresh/up-to-date");
            if (queryTerms.some((t) => title.includes(t)))
              reasons.push("Matches user intent");
            if (
              (domainCounts[s.domain] || 0) === 1 ||
              coverageCount === coverageMax
            )
              reasons.push("Unique contribution");
            if (text.length > 800 && /\n[-•\d]/.test(text))
              reasons.push("Well-structured content");

            if (reasons.length === 0)
              reasons.push("Best relative fit vs alternatives");
            return reasons.slice(0, 4);
          };

          return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-green-900 mb-1">
                Why These Sources Were Cited
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Evidence-driven hypotheses based on claim coverage, authority,
                freshness, and intent match.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {citedSources.slice(0, 10).map((s: any, i: number) => (
                  <div
                    key={s.source_id || i}
                    className="bg-white rounded-lg p-4 border border-green-200"
                  >
                    <div
                      className="font-medium text-green-900 truncate"
                      title={s.title || s.url}
                    >
                      {s.title || s.url}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {s.domain}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reasonFor(s).map((r, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {citedSources.length > 10 && (
                <div className="text-xs text-green-700 mt-3">
                  + {citedSources.length - 10} more not shown
                </div>
              )}
            </div>
          );
        })()}

        {/* Why Sources Get Ignored (Not Cited) */}
        {(() => {
          const citedIds = new Set(
            (bundle.evidence || []).map((e: any) => e.source_id)
          );
          const allSources = (bundle.sources || []) as any[];
          const uncited = allSources.filter(
            (s: any) => !citedIds.has(s.source_id)
          );
          if (uncited.length === 0) return null;

          const toDate = (iso?: string) => {
            if (!iso) return null;
            try {
              return new Date(iso.endsWith("Z") ? iso : iso + "Z");
            } catch {
              return null;
            }
          };

          const citedDomains = new Set(
            allSources
              .filter((s: any) => citedIds.has(s.source_id))
              .map((s: any) => s.domain)
          );

          const reasonFor = (s: any): string => {
            const text: string = (s.raw_text || "").toString();
            const url: string = (s.url || "").toLowerCase();
            const domain: string = (s.domain || "").toLowerCase();
            const credibility = (s.credibility || {}).score ?? 0.5;
            const published = toDate(s.published_at);
            const yearsOld = published
              ? (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24 * 365)
              : null;

            if (s.paywall === true || url.includes("paywall"))
              return "Paywalled / not accessible";
            if (text.length < 500) return "Thin content (not enough substance)";
            if (
              domain.includes("blog") ||
              url.includes("/blog/") ||
              url.includes("/newsroom/")
            )
              return "Promotional/blog content";
            // NEW: Passage-based selection (not domain authority)
            if (!text || text.length < 200) return "No extractable passages";

            const queryWords: string[] = (bundle.run?.query || "")
              .toLowerCase()
              .split(" ");
            const hasQueryTerms = queryWords.some(
              (term: string) =>
                term.length > 3 && text.toLowerCase().includes(term)
            );
            if (!hasQueryTerms) return "Weak passage relevance (low BM25)";

            // Check for clear structure
            const sentences = text.split(". ");
            if (sentences.length < 3) return "Poor text structure";

            // No longer using credibility scores
            if (yearsOld !== null && yearsOld > 5) return "Likely outdated";
            if (citedDomains.has(s.domain))
              return "Duplicate coverage vs. already cited domain";
            return "Weaker passages vs. cited sources";
          };

          return (
            <Card>
              <CardHeader>
                <CardTitle>Why Sources Get Ignored (Not Cited)</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-red-700 mb-2">
                  These were discovered but not referenced in the answer.
                  Heuristics below explain likely reasons.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uncited.slice(0, 10).map((s: any, i: number) => (
                    <div
                      key={s.source_id || i}
                      className="bg-white rounded-lg p-4 border border-red-200"
                    >
                      <div
                        className="font-medium text-red-900 truncate"
                        title={s.title || s.url}
                      >
                        {s.title || s.url}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {s.domain}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200">
                          {reasonFor(s)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {uncited.length > 10 && (
                  <div className="text-xs text-red-600 mt-3">
                    + {uncited.length - 10} more not shown
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })()}

        {/* AI Search Mechanism Analysis */}
        {analysisData.ai_search_intelligence && (
          <Card>
            <CardHeader>
              <CardTitle>
                What Types of Sources Does AI Search Prefer?
              </CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-purple-700 mb-2">
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
            </CardBody>
          </Card>
        )}

        {/* Content Strategy Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle>Content Strategy Intelligence</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>💡 Content Gap Analysis</CardTitle>
                </CardHeader>
                <CardBody>
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
                          {
                            new Set(bundle.sources.map((s: any) => s.domain))
                              .size
                          }{" "}
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
                        No strong sources found - potential to be the
                        authoritative voice on this topic
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📝 Format Recommendations</CardTitle>
                </CardHeader>
                <CardBody>
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
                          <span className="text-green-800">
                            Industry Reports
                          </span>
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
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* Immediate Action Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Immediate Action Plan</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🎯 This Quarter's Priorities</CardTitle>
                </CardHeader>
                <CardBody>
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
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 Success Metrics</CardTitle>
                </CardHeader>
                <CardBody>
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
                        Run this analysis monthly to track progress and identify
                        new opportunities
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* Competitive Landscape */}
        {analysisData.ai_search_intelligence?.competitive_landscape && (
          <Card>
            <CardHeader>
              <CardTitle>Who's Winning AI Search and Why?</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-orange-700 mb-3">
                Analysis of which publishers are most successful at getting
                cited by AI, and what strategies they use.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-orange-700 mb-2">
                    Winning Publishers
                  </h5>
                  <div className="space-y-2">
                    {(
                      analysisData.visibility_intelligence?.winning_domains ||
                      []
                    )
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
            </CardBody>
          </Card>
        )}

        {/* AI Selection Performance by Type */}
        <Card>
          <CardHeader>
            <CardTitle>
              Which Source Types Have the Best AI Selection Rates?
            </CardTitle>
          </CardHeader>
          <CardBody>
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
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Complete Source Analysis - What AI Actually Selected
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-700 mb-3">
              Full breakdown of every source that was cited by AI for this
              query, showing the exact characteristics that led to selection.
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
                      <td className="px-2 py-1 align-top">
                        {s.title || s.url}
                      </td>
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
          </CardBody>
        </Card>

        {analysisData.panels?.notable_citations?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Gold Standard Sources - What AI Considers Most Authoritative
              </CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-yellow-700 mb-3">
                The highest-quality sources identified by AI search, showing
                what characteristics make content most trustworthy.
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
            </CardBody>
          </Card>
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
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm text-blue-600 font-medium"
                  onClick={() => generatePDF()}
                >
                  📄 Download Intelligence Report PDF
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

"use client";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/Modal";
import ViewReport from "@/components/ViewReport";

interface IntelligenceReport {
  run_id: string;
  query: string;
  search_model: string;
  created_at: string;
  generated_at: string;
  has_analysis: boolean;
}

interface RecentRun {
  run_id: string;
  ts: number;
  query?: string;
  subject?: string;
}

interface AggregateData {
  runs: number;
  totals: {
    total_sources: number;
    total_cited_sources: number;
    avg_citation_rate: number;
  };
  domains_top: [string, number][];
  source_categories: Record<string, number>;
  domains_by_category: Record<string, [string, {domain: string, url: string, title: string, source_id: string}[]][]>;
}

export default function MainInsightsPanel() {
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agg, setAgg] = useState<AggregateData | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [activeSection, setActiveSection] = useState<"overview" | "reports" | "analysis">("overview");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedRunBundle, setSelectedRunBundle] = useState<any>(null);
  const [metaAnalysis, setMetaAnalysis] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedSubject]);

  const loadMetaAnalysis = async () => {
    if (!selectedSubject) return;
    
    try {
      const metaUrl = `${apiBaseUrl}/api/insights/meta_analysis?subject=${encodeURIComponent(selectedSubject)}`;
      const metaRes = await fetch(metaUrl);
      const metaJson = await metaRes.json();
      setMetaAnalysis(metaJson);
    } catch (e: any) {
      console.error("Failed to load meta analysis:", e);
    }
  };

  useEffect(() => {
    if (activeSection === "analysis" && selectedSubject) {
      loadMetaAnalysis();
    }
  }, [activeSection, selectedSubject]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load available subjects
      const subjectsRes = await fetch(`${apiBaseUrl}/api/insights/subjects`);
      const subjectsJson = await subjectsRes.json();
      setSubjects(subjectsJson.subjects || []);

      // Load recent runs
      const recentUrl = selectedSubject && selectedSubject.trim() 
        ? `${apiBaseUrl}/api/insights/recent?subject=${encodeURIComponent(selectedSubject)}`
        : `${apiBaseUrl}/api/insights/recent`;
      const recentRes = await fetch(recentUrl);
      const recentJson = await recentRes.json();
      
      // Enrich recent runs with query and subject data
      const enrichedRecent = await Promise.all(
        (recentJson.items || []).slice(0, 10).map(async (run: RecentRun) => {
          try {
            const runRes = await fetch(`${apiBaseUrl}/api/runs/${run.run_id}`);
            if (runRes.ok) {
              const runData = await runRes.json();
              return {
                ...run,
                query: runData.query || 'Unknown query',
                subject: runData.subject || 'Unknown subject'
              };
            }
          } catch (e) {
            console.warn(`Failed to load details for run ${run.run_id}`);
          }
          return run;
        })
      );
      setRecent(enrichedRecent);

      // Load stored intelligence reports
      const reportsRes = await fetch(`${apiBaseUrl}/api/insights/reports`);
      const reportsJson = await reportsRes.json();
      setReports(reportsJson.reports || []);

      // Load aggregate data
      const aggUrl = selectedSubject && selectedSubject.trim()
        ? `${apiBaseUrl}/api/insights/aggregate?subject=${encodeURIComponent(selectedSubject)}`
        : `${apiBaseUrl}/api/insights/aggregate`;
      const aggRes = await fetch(aggUrl);
      const aggJson = await aggRes.json();
      setAgg(aggJson);
    } catch (e: any) {
      setError(e?.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const recallReport = async (runId: string) => {
    try {
      setLoading(true);
      // First get the full run bundle (same as search page)
      const bundleResponse = await fetch(`${apiBaseUrl}/api/runs/${runId}/trace`);
      if (!bundleResponse.ok) {
        throw new Error("Failed to get run data");
      }
      const bundle = await bundleResponse.json();
      
      // Set the bundle and open modal - ViewReport will handle the analysis fetching
      setSelectedRunBundle(bundle);
      setShowReportModal(true);
    } catch (e: any) {
      alert(`Error loading report: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (runId: string) => {
    try {
      setLoading(true);
      // Get the run bundle first
      const bundleResponse = await fetch(`${apiBaseUrl}/api/runs/${runId}/trace`);
      if (!bundleResponse.ok) {
        throw new Error("Failed to get run data");
      }
      const bundle = await bundleResponse.json();
      
      // Open modal with bundle - ViewReport will handle generation
      setSelectedRunBundle(bundle);
      setShowReportModal(true);
    } catch (e: any) {
      alert(`Error loading run data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) return <div className="p-4">Loading insights...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          variant={activeSection === "overview" ? "solid" : "outline"}
          size="sm"
          onClick={() => setActiveSection("overview")}
        >
          Overview
        </Button>
        <Button
          variant={activeSection === "reports" ? "solid" : "outline"}
          size="sm"
          onClick={() => setActiveSection("reports")}
        >
          Intelligence Reports ({reports.length})
        </Button>
        <Button
          variant={activeSection === "analysis" ? "solid" : "outline"}
          size="sm"
          onClick={() => setActiveSection("analysis")}
        >
          Analysis
        </Button>
        
        {/* Subject Filter */}
        {subjects.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-slate-600">Subject:</label>
            <select
              className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Search Performance Summary</CardTitle>
            </CardHeader>
            <CardBody>
              {agg && agg.runs > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{agg.runs}</div>
                    <div className="text-sm text-slate-600">Search Runs</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{agg.totals.total_sources}</div>
                    <div className="text-sm text-slate-600">Sources Found</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">{agg.totals.total_cited_sources}</div>
                    <div className="text-sm text-slate-600">Sources Cited</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {(agg.totals.avg_citation_rate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-600">Citation Rate</div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 text-center py-8">
                  No search data available. Run some searches to see insights.
                </div>
              )}
            </CardBody>
          </Card>

          {agg && agg.domains_by_category && Object.keys(agg.domains_by_category).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cited Domains by Source Category</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {Object.entries(agg.domains_by_category)
                    .sort(([,a], [,b]) => b.reduce((sum, [,articles]) => sum + articles.length, 0) - a.reduce((sum, [,articles]) => sum + articles.length, 0))
                    .map(([category, domains]) => {
                      const totalCount = domains.reduce((sum, [,articles]) => sum + articles.length, 0);
                      const isExpanded = expandedCategories.has(category);
                      
                      return (
                        <div key={category} className="border rounded-lg">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex justify-between items-center p-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize text-slate-900">
                                {category.replace('_', ' ')}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                {totalCount}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500">
                                {totalCount} citation{totalCount !== 1 ? 's' : ''} • {domains.length} domain{domains.length !== 1 ? 's' : ''}
                              </span>
                              <svg
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="border-t bg-slate-50 p-3">
                              <div className="space-y-3">
                                {domains.map(([domain, articles]) => (
                                  <div key={domain} className="space-y-1">
                                    <div className="font-medium text-slate-700 text-sm">
                                      {domain} ({articles.length})
                                    </div>
                                    <div className="space-y-1 ml-4">
                                      {articles.map((article) => (
                                        <div key={article.source_id} className="py-1">
                                          <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors line-clamp-2"
                                            title={article.title}
                                          >
                                            {article.title}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardBody>
            </Card>
          )}

          {selectedSubject && agg && agg.domains_top.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Cited Domains ({selectedSubject})</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {agg.domains_top.slice(0, 10).map(([domain, count]) => (
                    <div key={domain} className="flex justify-between items-center py-1">
                      <span className="font-medium">{domain}</span>
                      <span className="bg-slate-100 px-2 py-1 rounded text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Intelligence Reports Section */}
      {activeSection === "reports" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stored Intelligence Reports</CardTitle>
            </CardHeader>
            <CardBody>
              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.run_id} className="border rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 mb-1">
                            {report.query}
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div>Model: {report.search_model}</div>
                            <div>
                              Search: {new Date(report.created_at).toLocaleDateString()}
                              {report.generated_at && (
                                <span> • Report: {new Date(report.generated_at).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div>Run ID: {report.run_id}</div>
                          </div>
                        </div>
                        <div className="ml-4 space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => recallReport(report.run_id)}
                          >
                            Recall Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600 text-center py-8">
                  No intelligence reports generated yet. 
                  <br />
                  Run searches and generate intelligence reports to see them here.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recent Runs without Reports */}
          {recent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Runs - Generate Intelligence Reports</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {recent.slice(0, 5).map((run) => {
                    // Check if this run already has a report
                    const hasReport = reports.some(r => r.run_id === run.run_id);
                    if (hasReport) return null;
                    
                    return (
                      <div key={run.run_id} className="border rounded-lg p-4 hover:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 mb-1">
                              {run.query || 'Loading query...'}
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <div>Subject: {run.subject || 'Loading...'}</div>
                              <div>Date: {new Date(run.ts * 1000).toLocaleDateString()}</div>
                              <div className="text-xs text-slate-500">Run ID: {run.run_id}</div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              size="sm"
                              variant="solid"
                              onClick={() => generateReport(run.run_id)}
                              disabled={loading}
                            >
                              Generate Report
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
                {recent.filter(run => !reports.some(r => r.run_id === run.run_id)).length === 0 && (
                  <div className="text-slate-600 text-center py-4">
                    All recent runs have intelligence reports generated.
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Analysis Section - Meta-Intelligence Dashboard */}
      {activeSection === "analysis" && (
        <div className="space-y-6">
          {!selectedSubject ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-slate-600">
                  <p className="text-lg font-medium mb-2">Select a Subject for Meta-Intelligence Analysis</p>
                  <p>Choose a subject above to analyze patterns across all your searches in that domain.</p>
                </div>
              </CardBody>
            </Card>
          ) : !metaAnalysis ? (
            <Card>
              <CardBody>
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Analyzing patterns across all {selectedSubject} queries...</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Header */}
              <Card>
                <CardHeader>
                  <CardTitle>🧠 AI Search Marketing Intelligence</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{metaAnalysis.total_queries_analyzed}</div>
                        <div className="text-sm text-blue-700">Queries Analyzed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{metaAnalysis.competitive_landscape?.dominant_players?.length || 0}</div>
                        <div className="text-sm text-green-700">Competing Domains</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{metaAnalysis.content_opportunities?.gaps?.length || 0}</div>
                        <div className="text-sm text-orange-700">Content Gaps</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{metaAnalysis.competitive_landscape?.market_concentration?.market_structure || "Unknown"}</div>
                        <div className="text-sm text-purple-700">Market Type</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 mt-4">
                    <strong>Subject Intelligence Report:</strong> {selectedSubject} — Cross-query patterns and strategic recommendations
                  </p>
                </CardBody>
              </Card>

              {/* Competitive Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Competitive Analysis - Who Dominates AI Citations</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-800 mb-3">Market Leaders</h4>
                      <div className="space-y-2">
                        {metaAnalysis.competitive_landscape?.dominant_players?.slice(0, 8).map((player: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <span className="font-medium text-slate-700">{player.domain}</span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-slate-900">{player.query_presence_pct}%</div>
                              <div className="text-xs text-slate-500">{player.total_citations} citations</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-3">Market Concentration</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-yellow-800 mb-2">
                          {metaAnalysis.competitive_landscape?.market_concentration?.market_structure}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Top 3 Market Share:</span>
                            <span className="font-medium">{metaAnalysis.competitive_landscape?.market_concentration?.top_3_share}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Market Leader:</span>
                            <span className="font-medium">{metaAnalysis.competitive_landscape?.market_concentration?.market_leader_share}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HHI Score:</span>
                            <span className="font-medium">{metaAnalysis.competitive_landscape?.market_concentration?.herfindahl_index}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Content Strategy Intelligence */}
              <Card>
                <CardHeader>
                  <CardTitle>💡 Content Strategy Intelligence - Gaps & Opportunities</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-800 mb-3">🎯 High-Opportunity Gaps</h4>
                      {metaAnalysis.content_opportunities?.low_competition_topics?.length > 0 ? (
                        <div className="space-y-3">
                          {metaAnalysis.content_opportunities.low_competition_topics.slice(0, 5).map((gap: any, i: number) => (
                            <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="font-medium text-green-900 text-sm mb-1">{gap.query}</div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-green-700">Competition: {gap.source_count} sources</span>
                                <span className="bg-green-200 text-green-800 px-2 py-1 rounded font-medium">
                                  {gap.opportunity_score} opportunity
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-600 text-sm">
                          No low-competition opportunities found. All topics have moderate to high competition.
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-3">📊 Source Category Performance</h4>
                      <div className="space-y-2">
                        {metaAnalysis.competitive_landscape?.category_performance?.slice(0, 6).map((category: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <span className="text-slate-700 capitalize">{category.category.replace('_', ' ')}</span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-slate-900">{category.citation_rate.toFixed(2)} rate</div>
                              <div className="text-xs text-slate-500">{category.total_citations} citations</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Strategic Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Strategic Recommendations & Action Plans</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-blue-800 mb-3">Immediate Actions</h4>
                      <div className="space-y-3">
                        {metaAnalysis.strategic_recommendations?.content_strategy?.map((rec: any, i: number) => (
                          <div key={i} className="border-l-4 border-blue-500 bg-blue-50 p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-blue-900">{rec.action}</div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                rec.priority === 'HIGH' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                              }`}>
                                {rec.priority}
                              </span>
                            </div>
                            <div className="text-sm text-blue-800">{rec.detail}</div>
                            <div className="text-xs text-blue-600 mt-1">{rec.impact}</div>
                          </div>
                        ))}
                        {metaAnalysis.strategic_recommendations?.competitive_positioning?.map((rec: any, i: number) => (
                          <div key={i} className="border-l-4 border-orange-500 bg-orange-50 p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-orange-900">{rec.action}</div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                rec.priority === 'HIGH' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                              }`}>
                                {rec.priority}
                              </span>
                            </div>
                            <div className="text-sm text-orange-800">{rec.detail}</div>
                            <div className="text-xs text-orange-600 mt-1">{rec.impact}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-800 mb-3">Quarterly Roadmap</h4>
                      <div className="space-y-3">
                        {metaAnalysis.strategic_recommendations?.quarterly_priorities?.map((quarter: any, i: number) => (
                          <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <div className="font-medium text-purple-900">{quarter.quarter}</div>
                              <div className="text-sm text-purple-700">{quarter.focus}</div>
                            </div>
                            <div className="text-xs text-purple-600">{quarter.rationale}</div>
                          </div>
                        ))}
                      </div>
                      
                      {metaAnalysis.strategic_recommendations?.publication_strategy?.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-slate-700 mb-2">Publication Strategy</h5>
                          {metaAnalysis.strategic_recommendations.publication_strategy.map((pub: any, i: number) => (
                            <div key={i} className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                              <div className="font-medium text-green-900">{pub.action}</div>
                              <div className="text-green-700">{pub.detail}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Intelligence Report Modal */}
      {showReportModal && selectedRunBundle && (
        <Modal
          open={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedRunBundle(null);
            // Refresh data when modal closes to update reports list
            loadData();
          }}
          title="AI Search Intelligence Report"
        >
          <ViewReport bundle={selectedRunBundle} />
        </Modal>
      )}
    </div>
  );
}
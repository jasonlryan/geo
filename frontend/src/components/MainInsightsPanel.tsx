"use client";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedSubject]);

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
      setRecent(recentJson.items || []);

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
      // Get the stored analysis
      const response = await fetch(`${apiBaseUrl}/api/runs/${runId}/llm_citation_analysis`);
      if (response.ok) {
        const analysis = await response.json();
        // Open in a modal or new window
        console.log("Recalled analysis:", analysis);
        // TODO: Implement modal display
        alert(`Intelligence Report recalled for run ${runId}. Check console for data.`);
      } else {
        alert("Failed to recall intelligence report");
      }
    } catch (e) {
      alert("Error recalling report");
    }
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

          {agg && agg.source_categories && Object.keys(agg.source_categories).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cited Source Categories</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {Object.entries(agg.source_categories)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center py-1">
                        <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded text-sm">{count}</span>
                      </div>
                    ))}
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
        </div>
      )}

      {/* Analysis Section - Placeholder for future AI Search Marketing Intelligence */}
      {activeSection === "analysis" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Search Marketing Intelligence</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-slate-600 space-y-4">
                <p>This section will contain advanced marketing intelligence features:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Content Strategy Intelligence</strong> - Gap analysis and recommendations</li>
                  <li><strong>Competitive Analysis</strong> - Who dominates AI citations in your space</li>
                  <li><strong>Authority Patterns</strong> - What makes content citation-worthy</li>
                  <li><strong>Publication Strategy</strong> - Where to publish for maximum AI visibility</li>
                  <li><strong>Action Plans</strong> - Quarterly content roadmaps</li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 rounded">
                  <p className="text-blue-800">
                    <strong>Coming Soon:</strong> Full AI Search Marketing Intelligence Dashboard
                    as described in the citation analysis requirements.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
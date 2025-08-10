import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          How AI Search Really Works
        </h1>
        <div className="text-sm text-slate-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
          Educational guide
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="text-lg text-blue-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <strong>Key Insight:</strong> AI search engines don't just find
            sources — they evaluate and choose which ones to actually cite.
            Understanding this process is crucial for content marketers.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔍 The AI Search Process (Step by Step)</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-6">
            When you ask ChatGPT, Claude, or other AI systems a question, here's
            what actually happens behind the scenes:
          </p>

          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              The 4-Stage AI Search Pipeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Discovery</h4>
                  <p className="text-slate-600">
                    AI searches the web and finds potentially relevant sources
                    based on keywords
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Evaluation</h4>
                  <p className="text-slate-600">
                    AI reads each source and evaluates content quality,
                    relevance, and authority
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Selection</h4>
                  <p className="text-slate-600">
                    AI chooses only the most trustworthy sources to actually
                    reference
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Citation</h4>
                  <p className="text-slate-600">
                    AI includes specific references to selected sources in the
                    final answer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Why This Matters for Marketers</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
            <p className="text-yellow-800">
              <strong>Critical Understanding:</strong> Being found by AI ≠ Being
              cited by AI
            </p>
            <ul className="mt-3 space-y-1 text-yellow-700">
              <li>
                <strong>Discovery Success:</strong> Your content appears in AI
                search results
              </li>
              <li>
                <strong>Citation Success:</strong> Your content gets referenced
                in AI answers
              </li>
              <li>
                <strong>The Gap:</strong> Most found content doesn't get cited
                (typical success rate: 15-25%)
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🏆 What Makes Content Citation-Worthy?</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-4">
            Based on our analysis of AI search behavior, content gets cited when
            it has:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Authoritative Source:</strong> Government, academic, or
                recognized industry expert
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Specific Data:</strong> Statistics, research findings,
                concrete examples
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Structured Content:</strong> Clear headings, bullet
                points, organized information
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Factual Tone:</strong> Objective information rather than
                promotional content
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Comprehensive Coverage:</strong> Detailed,
                well-researched content
              </div>
            </li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ Our Technical Implementation</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-4">
            This system reverse-engineers the AI search process to help you
            understand what works:
          </p>

          <ol className="space-y-2 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <div>
                <strong>Query Processing</strong> — We generate search variants
                and submit them to search APIs
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <div>
                <strong>Source Discovery</strong> — We use Tavily (designed for
                AI workflows) to get ranked, relevant URLs
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <div>
                <strong>Content Analysis</strong> — We fetch and parse each
                page's content
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <div>
                <strong>AI Composition</strong> — We have AI write an answer and
                track which sources it chooses to cite
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                5
              </span>
              <div>
                <strong>Citation Intelligence</strong> — We analyze the gap
                between found sources and cited sources
              </div>
            </li>
          </ol>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Tavily Search API</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-slate-700">
              <strong>Tavily</strong> is a web search API specifically designed
              for AI workflows. Unlike traditional search APIs, it returns
              results optimized for AI consumption with relevance scoring and
              content extraction. This gives us a reproducible, measurable way
              to analyze what AI systems actually select.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Source Credibility Scoring</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-slate-700 mb-4">
              <div className="flex justify-between">
                <strong>A</strong>: score ≥ 0.80
              </div>
              <div className="flex justify-between">
                <strong>B</strong>: 0.60–0.79
              </div>
              <div className="flex justify-between">
                <strong>C</strong>: 0.40–0.59
              </div>
              <div className="flex justify-between">
                <strong>D</strong>: &lt; 0.40
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              Bands summarize a source's prior credibility (gov/edu/peer‑review
              &gt; vendor docs &gt; news &gt; blogs/social) and can be refined
              by your own rules.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What the app shows</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Answer</strong> — text with inline [n] citations. Click
                a citation to open the source.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Sources</strong> — filterable list (type/band) with
                quick categories (gov, social, agency, academic, etc.).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>Analysis</strong> — funnel (Proposed → Fetched → Cited),
                top domains, coverage per claim, and a claims×sources matrix.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <strong>View Report</strong> — modal with a concise run report
                and one‑click downloads (Answer.md, sources.csv/json,
                methods.md).
              </div>
            </li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">⚠</span>
              <div>
                Citations are sentence‑level; every sentence should carry ≥1
                source.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">⚠</span>
              <div>
                If search or fetch returns little, you may see few/no citations
                — we surface that rather than hiding it.
              </div>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

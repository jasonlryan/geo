export default function AboutPage() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1>How AI Search Really Works</h1>
      <p className="text-lg text-blue-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <strong>Key Insight:</strong> AI search engines don't just find sources
        — they evaluate and choose which ones to actually cite. Understanding
        this process is crucial for content marketers.
      </p>

      <h2>🔍 The AI Search Process (Step by Step)</h2>
      <p>
        When you ask ChatGPT, Claude, or other AI systems a question, here's
        what actually happens behind the scenes:
      </p>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 my-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          The 4-Stage AI Search Pipeline
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Discovery</h4>
              <p className="text-gray-600">
                AI searches the web and finds potentially relevant sources based
                on keywords
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Evaluation</h4>
              <p className="text-gray-600">
                AI reads each source and evaluates content quality, relevance,
                and authority
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Selection</h4>
              <p className="text-gray-600">
                AI chooses only the most trustworthy sources to actually
                reference
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Citation</h4>
              <p className="text-gray-600">
                AI includes specific references to selected sources in the final
                answer
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2>🎯 Why This Matters for Marketers</h2>
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 my-4">
        <p>
          <strong>Critical Understanding:</strong> Being found by AI ≠ Being
          cited by AI
        </p>
        <ul className="mt-2">
          <li>
            <strong>Discovery Success:</strong> Your content appears in AI
            search results
          </li>
          <li>
            <strong>Citation Success:</strong> Your content gets referenced in
            AI answers
          </li>
          <li>
            <strong>The Gap:</strong> Most found content doesn't get cited
            (typical success rate: 15-25%)
          </li>
        </ul>
      </div>

      <h2>🏆 What Makes Content Citation-Worthy?</h2>
      <p>
        Based on our analysis of AI search behavior, content gets cited when it
        has:
      </p>
      <ul>
        <li>
          <strong>Authoritative Source:</strong> Government, academic, or
          recognized industry expert
        </li>
        <li>
          <strong>Specific Data:</strong> Statistics, research findings,
          concrete examples
        </li>
        <li>
          <strong>Structured Content:</strong> Clear headings, bullet points,
          organized information
        </li>
        <li>
          <strong>Factual Tone:</strong> Objective information rather than
          promotional content
        </li>
        <li>
          <strong>Comprehensive Coverage:</strong> Detailed, well-researched
          content
        </li>
      </ul>

      <h2>⚙️ Our Technical Implementation</h2>
      <p>
        This system reverse-engineers the AI search process to help you
        understand what works:
      </p>

      <ol>
        <li>
          <strong>Query Processing</strong> — We generate search variants and
          submit them to search APIs
        </li>
        <li>
          <strong>Source Discovery</strong> — We use Tavily (designed for AI
          workflows) to get ranked, relevant URLs
        </li>
        <li>
          <strong>Content Analysis</strong> — We fetch and parse each page's
          content
        </li>
        <li>
          <strong>AI Composition</strong> — We have AI write an answer and track
          which sources it chooses to cite
        </li>
        <li>
          <strong>Citation Intelligence</strong> — We analyze the gap between
          found sources and cited sources
        </li>
      </ol>

      <h2>🎯 Tavily Search API</h2>
      <p>
        <strong>Tavily</strong> is a web search API specifically designed for AI
        workflows. Unlike traditional search APIs, it returns results optimized
        for AI consumption with relevance scoring and content extraction. This
        gives us a reproducible, measurable way to analyze what AI systems
        actually select.
      </p>

      <h2>📊 Source Credibility Scoring</h2>
      <ul>
        <li>
          <strong>A</strong>: score ≥ 0.80
        </li>
        <li>
          <strong>B</strong>: 0.60–0.79
        </li>
        <li>
          <strong>C</strong>: 0.40–0.59
        </li>
        <li>
          <strong>D</strong>: &lt; 0.40
        </li>
      </ul>
      <p>
        Bands summarize a source’s prior credibility (gov/edu/peer‑review &gt;
        vendor docs &gt; news &gt; blogs/social) and can be refined by your own
        rules.
      </p>
      <h2>What the app shows</h2>
      <ul>
        <li>
          <strong>Answer</strong> — text with inline [n] citations. Click a
          citation to open the source.
        </li>
        <li>
          <strong>Sources</strong> — filterable list (type/band) with quick
          categories (gov, social, agency, academic, etc.).
        </li>
        <li>
          <strong>Analysis</strong> — funnel (Proposed → Fetched → Cited), top
          domains, coverage per claim, and a claims×sources matrix.
        </li>
        <li>
          <strong>View Report</strong> — modal with a concise run report and
          one‑click downloads (Answer.md, sources.csv/json, methods.md).
        </li>
      </ul>
      <h2>Notes</h2>
      <ul>
        <li>
          Citations are sentence‑level; every sentence should carry ≥1 source.
        </li>
        <li>
          If search or fetch returns little, you may see few/no citations — we
          surface that rather than hiding it.
        </li>
      </ul>
    </div>
  );
}

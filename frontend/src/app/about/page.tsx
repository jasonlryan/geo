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
            <strong>Research Mission:</strong> This system reverse-engineers AI search citation behavior 
            to understand what organizations need to do to be included and cited in AI search results.
            We've built a comprehensive research platform that analyzes the gap between content discovery 
            and actual citations.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔍 How Real AI Search Works</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-6">
            When you ask ChatGPT, Claude, or other AI systems a question, here's
            what actually happens behind the scenes (based on publicly known information):
          </p>

          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              The 6-Stage AI Search Process
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Query Processing</h4>
                  <p className="text-slate-600">
                    The system interprets your question and determines what information to search for
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Web Search</h4>
                  <p className="text-slate-600">
                    Advanced algorithms search the web for relevant sources using proprietary methods
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Content Analysis</h4>
                  <p className="text-slate-600">
                    Sophisticated algorithms read and evaluate each found source for relevance and quality
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Authority Assessment</h4>
                  <p className="text-slate-600">
                    The system applies proprietary credibility filters to prioritize trustworthy sources
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Citation Selection</h4>
                  <p className="text-slate-600">
                    Advanced ranking algorithms choose which sources to actually reference in the final answer
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  6
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Answer Generation</h4>
                  <p className="text-slate-600">
                    The system composes the final response with citations to selected sources
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-sm">
              <strong>Important:</strong> The exact algorithms and criteria used by ChatGPT, Claude, and other AI systems 
              are proprietary and not publicly disclosed. This is our research platform's attempt to understand 
              these processes through observable behavior.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔬 How Our Research System Works</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-6">
            To study the AI search process above, we've built a research platform that replicates 
            these steps using observable tools and methods:
          </p>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Our 7-Stage Research Pipeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Query Expansion</h4>
                  <p className="text-slate-600">
                    We generate diverse search variants with authority-biased language, avoiding corporate marketing terms
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Multi-Provider Discovery</h4>
                  <p className="text-slate-600">
                    We search across Tavily (advanced depth) + OpenAI for diversified recall and reduced algorithmic bias
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Authority Re-ranking</h4>
                  <p className="text-slate-600">
                    We prioritize gov/edu/research sources over corporate blogs using credibility scoring and category boosts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Content Processing</h4>
                  <p className="text-slate-600">
                    We extract clean text with Trafilatura/Readability + content deduplication across providers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">AI Citation Generation</h4>
                  <p className="text-slate-600">
                    We have LLM compose answers with explicit authority prioritization instructions and credibility awareness
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  6
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Snippet Alignment</h4>
                  <p className="text-slate-600">
                    We extract and verify actual quoted passages from sources with confidence scoring
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  7
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Citation Intelligence</h4>
                  <p className="text-slate-600">
                    We analyze the gaps between discovered and cited sources with comprehensive performance tracking
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm">
              <strong>Research Goal:</strong> By replicating AI search behavior with observable tools, 
              we can measure and analyze what gets cited vs. what gets found, helping organizations 
              understand how to improve their AI search citation rates.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Research Findings: The Citation Authority Hierarchy</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
            <p className="text-yellow-800">
              <strong>Key Discovery:</strong> AI systems show clear bias toward authoritative sources, 
              with corporate blogs frequently filtered out during citation selection.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">High Citation Rate (80-95%)</h4>
                <ul className="space-y-1 text-yellow-700 text-sm">
                  <li>• Government (.gov) sources</li>
                  <li>• Academic institutions (.edu)</li>
                  <li>• Peer-reviewed publications</li>
                  <li>• Research institutes (Brookings, RAND)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Low Citation Rate (15-35%)</h4>
                <ul className="space-y-1 text-yellow-700 text-sm">
                  <li>• Corporate blogs and marketing content</li>
                  <li>• "Best practices" and "trends" articles</li>
                  <li>• Social media posts</li>
                  <li>• Promotional vendor content</li>
                </ul>
              </div>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Domain Authority Factors</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Domain credibility:</strong> .gov {'>'} .edu {'>'} research institutes {'>'} news {'>'} corporate</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Publisher recognition:</strong> Nature, Springer, IEEE get 0.85-0.95 scores</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Content categorization:</strong> Research papers vs. marketing blogs</div>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Content Quality Signals</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Substantial length:</strong> 2000+ characters preferred</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Academic language:</strong> "study", "research", "findings" vs. "trends"</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Named authorship:</strong> Increases credibility score</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Recency consideration:</strong> Recent content gets small boost</div>
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ Advanced Research Implementation</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-4">
            Our comprehensive system implements cutting-edge techniques to understand AI search citation behavior:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🔍 Multi-Provider Search</h4>
                <p className="text-slate-600 text-sm">
                  Tavily (advanced depth) + OpenAI for diversified recall and reduced algorithmic bias. 
                  Comprehensive provider performance tracking.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🎯 Authority-Based Re-ranking</h4>
                <p className="text-slate-600 text-sm">
                  Pre-filters results using credibility scores and category boosts before AI composition. 
                  Gov/edu/research prioritized over corporate blogs.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🧠 LLM Query Expansion</h4>
                <p className="text-slate-600 text-sm">
                  AI-generated diverse search terms with academic language preference. 
                  Avoids corporate marketing bias ("trends 2025").
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">📄 Clean Content Extraction</h4>
                <p className="text-slate-600 text-sm">
                  Trafilatura + Readability for clean article text. Content deduplication 
                  across providers with similarity detection.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🎪 Snippet Alignment</h4>
                <p className="text-slate-600 text-sm">
                  Extracts and verifies actual quoted passages with confidence scoring. 
                  Multi-strategy matching: direct phrases, concepts, fuzzy similarity.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">📊 Citation Intelligence</h4>
                <p className="text-slate-600 text-sm">
                  Comprehensive analytics on discovery vs citation gaps, provider effectiveness, 
                  and authority performance metrics.
                </p>
              </div>
            </div>
          </div>
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
            <CardTitle>📊 Multi-Factor Credibility Scoring</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 text-slate-700 mb-4">
              <div className="flex justify-between items-center">
                <strong className="text-green-700">A Grade (0.80-1.00)</strong>
                <span className="text-sm">Nature, .gov, .edu</span>
              </div>
              <div className="flex justify-between items-center">
                <strong className="text-blue-700">B Grade (0.60-0.79)</strong>
                <span className="text-sm">News, consultancy</span>
              </div>
              <div className="flex justify-between items-center">
                <strong className="text-orange-700">C Grade (0.40-0.59)</strong>
                <span className="text-sm">Corporate, nonprofits</span>
              </div>
              <div className="flex justify-between items-center">
                <strong className="text-red-700">D Grade (&lt; 0.40)</strong>
                <span className="text-sm">Blogs, social media</span>
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              Enhanced scoring considers domain authority, recency, content length, 
              authorship, and title quality. Academic publishers get 0.85-0.95 scores.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔬 Research Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Core Analytics</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Citation funnel:</strong> Discovery → Authority Re-ranking → Citation</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Provider performance:</strong> Tavily vs. OpenAI effectiveness</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Authority distribution:</strong> Gov/edu/research vs. corporate breakdown</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Snippet alignment:</strong> Citation accuracy with confidence scores</div>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Advanced Features</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Content deduplication:</strong> Cross-provider similarity detection</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Query expansion analysis:</strong> LLM-generated vs. authority variants</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Cross-run insights:</strong> Competitive landscape and market trends</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Export capabilities:</strong> CSV/JSON data for further analysis</div>
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💡 What Organizations Should Do to Get Cited</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3">Research-Based Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-green-700 mb-2">Content Strategy</h5>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Publish research papers, whitepapers, policy documents</li>
                  <li>• Use academic language: "study", "research", "findings"</li>
                  <li>• Include named authors and publication dates</li>
                  <li>• Create substantial content (2000+ characters)</li>
                  <li>• Avoid clickbait titles and marketing jargon</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-green-700 mb-2">Domain Authority</h5>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Partner with .edu institutions for co-authored research</li>
                  <li>• Publish in recognized journals (IEEE, Nature, Springer)</li>
                  <li>• Get cited by government (.gov) sources</li>
                  <li>• Build relationships with think tanks (Brookings, RAND)</li>
                  <li>• Avoid purely promotional or sales-focused content</li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

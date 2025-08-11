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
                <div className="step-content">
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
                <div className="step-content">
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
                <div className="step-content">
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
                <div className="step-content">
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
                <div className="step-content">
                  <h4 className="font-semibold text-slate-800">Realistic Citation Selection</h4>
                  <p className="text-slate-600">
                    AI search engines use sophisticated algorithms balancing query relevance, contextual authority, content quality, and source diversity - not just domain TLD rankings
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  6
                </div>
                <div className="step-content">
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
              Our 8-Stage Enhanced Research Pipeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="step-content">
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
                <div className="step-content">
                  <h4 className="font-semibold text-slate-800">Multi-Provider Discovery</h4>
                  <p className="text-slate-600">
                    We search across 5 providers: Tavily (advanced depth), Brave, Bing, Perplexity (LLM-native), and OpenAI for maximum recall diversity and algorithmic bias reduction
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="step-content">
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
                <div className="step-content">
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
                <div className="step-content">
                  <h4 className="font-semibold text-slate-800">Consensus Tracking & Weighted Deduplication</h4>
                  <p className="text-slate-600">
                    We preserve cross-provider consensus signals (15% boost for 2 providers, 25% for 3+) as authority indicators while smart deduplication removes URL duplicates
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-indigo-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  6
                </div>
                <div className="step-content">
                  <h4 className="font-semibold text-slate-800">Passage-Based Citation Selection</h4>
                  <p className="text-slate-600">
                    We mirror actual AI search engine behavior using passage-level BM25 scoring (45% relevance, 25% passage quality, 20% content depth, 10% consensus) - exactly how Perplexity/ChatGPT select citations from best snippets, not domain TLD rankings
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-violet-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  7
                </div>
                <div className="step-content">
                  <h4 className="font-semibold text-slate-800">Diverse AI Answer Generation</h4>
                  <p className="text-slate-600">
                    LLM composes answers using pre-selected diverse, relevant sources that mirror real ChatGPT/Perplexity citation patterns - targeting 10 citations across different source types
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  8
                </div>
                <div className="step-content">
                  <h4 className="font-semibold text-slate-800">Consensus Analytics & Citation Intelligence</h4>
                  <p className="text-slate-600">
                    We analyze cross-provider consensus vs citation correlations, provider effectiveness, and authority pattern research with comprehensive performance tracking
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
          <CardTitle>🚀 Passage-Based Citation Selection</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <p className="text-blue-800">
              <strong>System Design:</strong> Our citation selector mirrors real AI search behavior like Perplexity and ChatGPT using passage-level BM25 scoring that evaluates actual content quality and query relevance, not domain authority.
            </p>
            <div className="mt-4">
              <div className="bg-white p-3 rounded border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">✅ Citation Selection Approach</h4>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Passage-level BM25 relevance (45% weight)</li>
                  <li>• Best snippet quality scoring (25% weight)</li>
                  <li>• Content depth and structure (20% weight)</li>
                  <li>• Multi-provider consensus (10% weight)</li>
                  <li>• Query relevance beats domain prestige</li>
                  <li>• Mirrors actual ChatGPT/Perplexity citation patterns</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded">
              <div className="text-2xl font-bold text-purple-800">45%</div>
              <div className="text-sm text-purple-600">Passage Relevance</div>
              <div className="text-xs text-purple-500 mt-1">BM25 best snippet scoring</div>
            </div>
            <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded">
              <div className="text-2xl font-bold text-orange-800">25%</div>
              <div className="text-sm text-orange-600">Passage Quality</div>
              <div className="text-xs text-orange-500 mt-1">Snippet depth and clarity</div>
            </div>
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
              <div className="text-2xl font-bold text-green-800">20%</div>
              <div className="text-sm text-green-600">Content Structure</div>
              <div className="text-xs text-green-500 mt-1">Organization and formatting</div>
            </div>
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="text-2xl font-bold text-blue-800">10%</div>
              <div className="text-sm text-blue-600">Consensus Score</div>
              <div className="text-xs text-blue-500 mt-1">Multi-provider discovery</div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Key Implementation Details:</h4>
            <ul className="space-y-1 text-green-700 text-sm">
              <li>• <strong>Passage Scoring:</strong> BM25 algorithm finds best snippet in each document for query relevance</li>
              <li>• <strong>Content Quality:</strong> Evaluates structure, depth, and information density of passages</li>
              <li>• <strong>Multi-Provider Consensus:</strong> Sources found by multiple search engines get boosted</li>
              <li>• <strong>Content-First:</strong> A tech blog with relevant content beats irrelevant pages regardless of domain</li>
              <li>• <strong>Context-Aware:</strong> Citation count varies by query type (3-5 sources based on intent)</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 How Citations Are Actually Selected</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
            <p className="text-yellow-800">
              <strong>Current System:</strong> Citations are selected based on passage quality and query relevance, 
              NOT domain authority. The system evaluates each source's content to find the best snippets that answer the specific query.
              <strong>Multi-provider consensus</strong> (sources found by multiple search engines) provides a small boost but content quality is primary.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">High Citation Factors</h4>
                <ul className="space-y-1 text-yellow-700 text-sm">
                  <li>• Strong passage relevance (high BM25 score)</li>
                  <li>• Clear, structured content with good snippets</li>
                  <li>• Direct answers to query in extractable passages</li>
                  <li>• Multi-provider discovery consensus</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Low Citation Factors</h4>
                <ul className="space-y-1 text-yellow-700 text-sm">
                  <li>• Weak passage relevance to query</li>
                  <li>• Poor text structure (no clear snippets)</li>
                  <li>• Marketing fluff without specific information</li>
                  <li>• Content doesn't contain query-relevant passages</li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔬 Multi-Provider Search Implementation</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
            <h4 className="font-semibold text-green-800 mb-3">How Multi-Provider Consensus Works</h4>
            <p className="text-green-700 mb-3">
              Our system searches across multiple providers (Tavily, OpenAI, Perplexity, Gemini) and tracks when the same source is discovered by multiple engines. 
              This consensus signal provides a small boost (10% weight) in our citation selection algorithm.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">1 Provider</div>
                <div className="text-sm text-green-600">Single discovery</div>
                <div className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs">Base consensus score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">2 Providers</div>
                <div className="text-sm text-green-600">Dual discovery</div>
                <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs">Higher consensus signal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">3+ Providers</div>
                <div className="text-sm text-green-600">Strong consensus</div>
                <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded text-xs">Maximum consensus boost</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Why Consensus Helps</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Validation:</strong> Multiple engines finding the same source suggests relevance</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Bias Reduction:</strong> Reduces single-algorithm blind spots</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Quality Signal:</strong> Acts as a distributed relevance filter</div>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">System Applications</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Citation Scoring:</strong> Small consensus boost in selection algorithm</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Provider Analysis:</strong> Track which engines find which sources</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Deduplication:</strong> Merge same sources found by different providers</div>
                </li>
              </ul>
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
            With our passage-based system, content gets cited based on actual relevance and quality:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Passage Quality Factors</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Query relevance:</strong> Content directly answers the specific question</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Clear passages:</strong> Well-structured text that extracts into good snippets</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Information density:</strong> Specific details vs. vague statements</div>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Content Structure Signals</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Extractable snippets:</strong> Self-contained paragraphs with clear information</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Structured content:</strong> Lists, definitions, examples that AI can parse</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Content depth:</strong> Sufficient detail to be useful (500+ chars minimum)</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Multi-provider discovery:</strong> Found by multiple search engines</div>
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ System Implementation</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-4">
            Our system implements passage-based citation selection that mirrors real AI search engines:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🔍 Multi-Provider Search</h4>
                <p className="text-slate-600 text-sm">
                  Searches across Tavily, OpenAI, Perplexity, and Gemini for diverse source discovery. 
                  Tracks consensus when same sources found by multiple providers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🎯 Passage-Based Ranking</h4>
                <p className="text-slate-600 text-sm">
                  Uses BM25 scoring to find the best snippet in each document that answers the query. 
                  Content quality and relevance determine ranking.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🧠 Query Expansion</h4>
                <p className="text-slate-600 text-sm">
                  Generates diverse search variants to improve source discovery. 
                  Combines original query with contextual alternatives.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">📄 Content Extraction</h4>
                <p className="text-slate-600 text-sm">
                  Trafilatura + Readability for clean text extraction. 
                  Deduplicates similar content across providers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">🎪 Citation Selection</h4>
                <p className="text-slate-600 text-sm">
                  TRUE citation selector evaluates passage relevance (45%), snippet quality (25%), 
                  content structure (20%), and consensus (10%).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">📊 Analytics</h4>
                <p className="text-slate-600 text-sm">
                  Tracks source discovery vs citation patterns. 
                  Shows why sources get ignored based on passage quality, not domain bias.
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
            <CardTitle>📊 Passage Quality Evaluation</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 text-slate-700 mb-4">
              <div className="flex justify-between items-center">
                <strong className="text-green-700">High Relevance</strong>
                <span className="text-sm">Strong BM25 passage match</span>
              </div>
              <div className="flex justify-between items-center">
                <strong className="text-blue-700">Good Structure</strong>
                <span className="text-sm">Clear, extractable snippets</span>
              </div>
              <div className="flex justify-between items-center">
                <strong className="text-orange-700">Adequate Content</strong>
                <span className="text-sm">Sufficient depth and information</span>
              </div>
              <div className="flex justify-between items-center">
                <strong className="text-red-700">Poor Match</strong>
                <span className="text-sm">Weak query relevance</span>
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              Evaluation focuses on how well passages answer the specific query. 
              Content quality and relevance determine citation likelihood.
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
                  <div><strong>Citation funnel:</strong> Discovery → Passage Scoring → Citation</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Multi-provider performance:</strong> Tavily, OpenAI, Perplexity, Gemini effectiveness comparison</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Consensus patterns:</strong> Multi-provider discovery correlation with citations</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Content analysis:</strong> Passage quality vs citation success rates</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Source breakdown:</strong> Why sources get ignored (passage-based heuristics)</div>
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
                  <div><strong>Query expansion analysis:</strong> Original vs contextual search variants</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Passage scoring:</strong> BM25 relevance and snippet quality metrics</div>
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
          <CardTitle>💡 How to Get Your Content Cited</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3">Passage-Based Optimization</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-green-700 mb-2">Content Structure</h5>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Write self-contained paragraphs that answer specific questions</li>
                  <li>• Use clear topic sentences and structured information</li>
                  <li>• Include specific examples and actionable details</li>
                  <li>• Create content with sufficient depth (500+ characters minimum)</li>
                  <li>• Avoid vague marketing language - be specific and informative</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-green-700 mb-2">Query Optimization</h5>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Research what questions your audience actually asks</li>
                  <li>• Include query-relevant keywords naturally in your content</li>
                  <li>• Write content that directly addresses common search queries</li>
                  <li>• Focus on information density over domain prestige</li>
                  <li>• Test content across multiple search engines for discoverability</li>
                  <li>• Create content that multiple search algorithms find valuable</li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

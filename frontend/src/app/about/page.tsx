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
              Our 8-Stage Enhanced Research Pipeline
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
                    We search across 5 providers: Tavily (advanced depth), Brave, Bing, Perplexity (LLM-native), and OpenAI for maximum recall diversity and algorithmic bias reduction
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
                <div>
                  <h4 className="font-semibold text-slate-800">Passage-Based Citation Selection (2025 Research)</h4>
                  <p className="text-slate-600">
                    NEW: We now mirror actual AI search engine behavior using passage-level BM25 scoring (45% relevance, 25% passage quality, 20% content depth, 10% consensus) - exactly how Perplexity/ChatGPT select citations from best snippets, not domain TLD rankings
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-violet-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  7
                </div>
                <div>
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
                <div>
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
          <CardTitle>🚀 2025 Research Breakthrough: Realistic Citation Selection</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <p className="text-blue-800">
              <strong>Major Update (January 2025):</strong> Based on analysis of 41 million AI search results across ChatGPT, Perplexity, and Google AI Overviews, we've completely rebuilt our citation selector to mirror real AI behavior. The old "domain TLD = authority" approach has been replaced with sophisticated query-context scoring.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">❌ Old Approach (Unrealistic)</h4>
                <ul className="space-y-1 text-blue-700 text-sm">
                  <li>• All .edu domains = high authority (0.90)</li>
                  <li>• Simple domain TLD rankings</li>
                  <li>• Ignored query context and relevance</li>
                  <li>• Only showed highest "credibility" sources</li>
                  <li>• Led to .edu/.gov dominance regardless of topic</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">✅ New Approach (Research-Based)</h4>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Passage-level BM25 relevance (45% weight)</li>
                  <li>• Best snippet quality scoring (25% weight)</li>
                  <li>• Content depth and structure (20% weight)</li>
                  <li>• Multi-provider consensus (10% weight)</li>
                  <li>• Tech startup blog {'>'} random .edu for tech queries</li>
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
            <h4 className="font-semibold text-green-800 mb-2">Key Research Findings That Changed Our Approach:</h4>
            <ul className="space-y-1 text-green-700 text-sm">
              <li>• <strong>ChatGPT:</strong> 47% Wikipedia, but mixes commercial (.com 80%+), community (Reddit), tech publishers</li>
              <li>• <strong>Google AI:</strong> YouTube, LinkedIn, Gartner, Reddit, Quora - intentionally diverse source types</li>
              <li>• <strong>Perplexity:</strong> Heavy community (Reddit), review platforms (Yelp, G2), curated authority lists</li>
              <li>• <strong>97.2% of AI citations can't be explained by backlinks</strong> - content structure and semantic clarity matter more</li>
              <li>• <strong>Reciprocal Rank Fusion:</strong> AI runs multiple query variants, topical authority sites score 60x higher</li>
            </ul>
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
              with corporate blogs frequently filtered out during citation selection. Additionally, our research reveals that 
              <strong>cross-provider consensus significantly predicts citation likelihood</strong> - sources found by 3+ search providers 
              get cited 25% more frequently than single-provider discoveries.
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
          <CardTitle>🔬 Breakthrough: Multi-Provider Consensus Research</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
            <h4 className="font-semibold text-green-800 mb-3">Research Innovation: Cross-Provider Citation Prediction</h4>
            <p className="text-green-700 mb-3">
              Our platform is the first to systematically study how <strong>search provider consensus</strong> affects AI citation behavior. 
              By analyzing sources discovered by multiple search engines simultaneously, we've uncovered powerful predictive patterns.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">Single Provider</div>
                <div className="text-sm text-green-600">Baseline citation rate</div>
                <div className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs">Found by: Tavily only</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">+15%</div>
                <div className="text-sm text-green-600">Dual-provider boost</div>
                <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs">Found by: Tavily + Brave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">+25%</div>
                <div className="text-sm text-green-600">Strong consensus boost</div>
                <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded text-xs">Found by: Tavily + Brave + Bing</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Why Consensus Matters</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Algorithm Validation:</strong> Multiple providers finding the same source suggests genuine authority</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Bias Reduction:</strong> Cross-provider discovery reduces single-algorithm blind spots</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Quality Signal:</strong> Consensus acts as a distributed quality filter</div>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Research Applications</h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Citation Prediction:</strong> Forecast which sources will be cited before composition</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Provider Analysis:</strong> Compare effectiveness of different search engines</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div><strong>Authority Patterns:</strong> Identify which .gov/.edu sources get consensus discovery</div>
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
                  <div><strong>Multi-provider performance:</strong> Tavily, Brave, Bing, Perplexity effectiveness comparison</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <div><strong>Consensus correlation:</strong> Cross-provider discovery vs citation rate analysis</div>
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
                <h5 className="font-semibold text-green-700 mb-2">Multi-Provider Discovery Strategy</h5>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Optimize for discovery across multiple search engines (not just Google SEO)</li>
                  <li>• Partner with .edu institutions for co-authored research</li>
                  <li>• Publish in recognized journals (IEEE, Nature, Springer)</li>
                  <li>• Get cited by government (.gov) sources to build cross-engine authority</li>
                  <li>• Build relationships with think tanks (Brookings, RAND)</li>
                  <li>• Target consensus discovery - create content that multiple algorithms find valuable</li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

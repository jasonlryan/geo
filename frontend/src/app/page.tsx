"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("Executive Search");
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&subject=${encodeURIComponent(subject)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const exampleQueries = [
    "AI leadership strategies",
    "Remote work productivity trends",
    "Cybersecurity best practices",
    "Sustainable business models",
    "Digital transformation frameworks"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            AI Search Citation Research
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Understand how AI search engines decide what to cite. Research the gap between content discovery 
            and actual citations to help organizations get included in AI search results.
          </p>
        </div>

        {/* Featured Search Component */}
        <Card className="max-w-4xl mx-auto mb-16 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-800">Start Your Research</CardTitle>
            <p className="text-slate-600 mt-2">
              Enter a query to analyze AI search citation behavior and authority patterns
            </p>
          </CardHeader>
          <CardBody className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Research Query
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., AI leadership strategies, cybersecurity frameworks..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject Area
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Executive Search, Technology, Healthcare..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button
                onClick={handleSearch}
                disabled={!query.trim()}
                className="w-full py-4 text-lg font-semibold"
              >
                Analyze AI Search Citations
              </Button>
            </div>

            {/* Example Queries */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Try these example queries:</h4>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(example)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardBody className="text-center p-6">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="font-semibold text-slate-800 mb-2">Multi-Provider Search</h3>
              <p className="text-slate-600 text-sm">
                Analyzes Tavily + OpenAI search results to understand algorithmic differences and citation patterns
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-semibold text-slate-800 mb-2">Authority Analysis</h3>
              <p className="text-slate-600 text-sm">
                Tracks how AI prioritizes gov/edu/research sources over corporate blogs with credibility scoring
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold text-slate-800 mb-2">Citation Intelligence</h3>
              <p className="text-slate-600 text-sm">
                Reveals the gap between content discovery and actual citations with comprehensive analytics
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Navigation to Main Sections */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Explore the Platform</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/search')}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800 mb-1">🔬 Search & Analyze</div>
                <div className="text-sm text-slate-600">
                  Run queries and analyze AI citation patterns in real-time
                </div>
              </button>
              
              <button
                onClick={() => router.push('/insights')}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800 mb-1">📈 Research Insights</div>
                <div className="text-sm text-slate-600">
                  Cross-query analysis and competitive intelligence dashboard
                </div>
              </button>

              <button
                onClick={() => router.push('/about')}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800 mb-1">📚 How It Works</div>
                <div className="text-sm text-slate-600">
                  Learn about our research methodology and findings
                </div>
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Research Mission Statement */}
        <div className="text-center mt-16 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2">Research Mission</h3>
            <p className="text-slate-600">
              This platform helps organizations understand what they need to do to be included 
              and cited in AI search results. By reverse-engineering AI citation behavior, we provide 
              actionable insights for content strategy and authority building.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

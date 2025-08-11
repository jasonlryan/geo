Citation Selection in AI-Powered Search Tools
Perplexity AI
Source Selection Algorithm: Perplexity uses a custom web index (initially leveraging Bing, now using its own crawler) to retrieve high-quality sources for a query
ethanlazuk.com
ethanlazuk.com
. It favors authoritative pages likely to answer the question, ranking results by relevance and trustworthiness rather than click-through probability. In fact, Perplexity’s system assigns trust scores to domains/pages to filter out low-quality content and search spam
ethanlazuk.com
, focusing on sources that are helpful and credible.
Retrieval vs. Generation Timing: Perplexity follows a strict retrieval-augmented generation approach – it finds information before and during answer construction. The AI is constrained not to introduce facts that aren’t backed by the retrieved documents
ethanlazuk.com
. As CEO Aravind Srinivas explains, “you’re not supposed to say anything that you don’t retrieve”, ensuring the model only uses information from its search results
ethanlazuk.com
. If adequate sources aren’t found, Perplexity will abstain or say it lacks a good answer rather than fabricate content.
Citation Ranking & Filtering: The platform typically pulls in multiple sources (often 3–5) for each query. Its ranking algorithms combine traditional keyword search (e.g. BM25) with modern techniques. It parses page content and evaluates which snippets best address the question. Content is ranked by helpfulness for answering the query, and Perplexity prioritizes highly trusted domains
ethanlazuk.com
ethanlazuk.com
. Less relevant or low-quality pages are filtered out via the trust score and relevance thresholds. This means the citations provided are usually from well-regarded sites or articles that directly answer the question.
Evidence Granularity: Perplexity works at the snippet level. Once it fetches relevant pages, it extracts key paragraphs or sentences from each, using LLMs and embeddings to identify the most pertinent sections
ethanlazuk.com
. These relevant snippets are then fed into the answer-generation model. Because the answer is composed entirely from these retrieved passages, each statement in the answer can be traced to a specific snippet in a source document. In other words, Perplexity doesn’t rely on general memory of a whole document – it grounds its answer in the specific pieces of text it pulled from the web.
Transparency & Traceability: Every factual claim in Perplexity’s answer is accompanied by a numbered citation (a footnote) linking to the source. Citations are embedded at the sentence level, demonstrating factual grounding and allowing users to verify each part of the answer
ethanlazuk.com
. For example, an answer might say “X is the tallest mountain in Europe¹,” with the superscript “¹” linking to a source that supports that fact. Clicking a citation opens the original page (or a preview of it), so users can see the evidence in context. This design makes it clear which source backs which piece of information. Perplexity’s emphasis is on transparency rather than driving traffic
ethanlazuk.com
– the sources are provided to increase trust in the answer, even if relatively few users click through. Users can hover or click the citation numbers to inspect the source content and ensure the AI’s summary accurately reflects the source.
Google Search Generative Experience (SGE)
Source Selection Algorithm: Google’s SGE generates answers by synthesizing content from multiple web sources that its algorithms deem relevant and authoritative. It begins with Google’s core search pipeline: for a given query, it uses AI to interpret intent and then retrieves results from the Google index. Rather than simply listing those results, the system’s LLM (e.g. PaLM 2 or Gemini) “synthesizes information from multiple high-authority sources into a concise, natural-language summary.”
wsiworld.com
In effect, SGE’s AI scans top search results (often ones already ranking highly due to Google’s traditional ranking signals like E-E-A-T) and decides which pieces of content to pull in. Google has noted that the underlying models don’t just summarize but also “choose which web results or data to surface” in the AI overview
wsiworld.com
, indicating the model plays a role in selecting the source snippets that will be cited. Sources with strong expertise, authoritativeness, and trust (like well-established sites or those with relevant experience on the topic) are more likely to be used in the answer
wsiworld.com
.
Retrieval vs. Generation Timing: SGE is a classic retrieval-augmented generation setup: the retrieval of information happens before and during answer construction. The AI overview is built on search results rather than from the model’s parametric memory alone. Google has emphasized that SGE’s answers put a premium on being “corroborated by reliable sources”
blog.google
wsiworld.com
. This means the generative model is fed with up-to-date search results and is instructed to ground the answer in that content. The citations are thus determined during answer generation (the model knows the sources as it writes the summary). It’s not a post-processing step but an integrated part of the generative experience – the model synthesizes and cites in one flow. (Google AI researchers are exploring frameworks like “AGReE” that integrate attribution into the generation process as well
ethanlazuk.com
.)
Citation Ranking & Filtering: The sources cited by SGE tend to be those already deemed relevant by Google’s ranking algorithms. Studies of SGE’s early results found that a large majority of cited links came from the top organic search results for the query
seranking.com
seranking.com
. In practice, SGE might gather information from (for example) the top 3–5 search hits, especially if they cover different facets of the query. It also appears to include a variety of source types (e.g. forums like Reddit for anecdotal queries vs. official sites for factual queries) to provide a balanced answer, though authoritative pages (Wikipedia, Britannica, major publishers) are frequently cited. Google has built content-quality filters into SGE; it “prioritizes trustworthy, experience-backed content” for inclusion
wsiworld.com
and avoids or delays generative answers for queries in sensitive YMYL (Your Money or Your Life) categories. In summary, SGE’s citation selection is tightly coupled to Google’s normal ranking (ensuring high relevance) with an added bias toward high E-E-A-T sources for safety and credibility
wsiworld.com
.
Evidence Granularity: SGE’s answers are grounded in passage-level evidence drawn from source pages. The AI isn’t just blindly trusting an entire document; it pinpoints specific bits of information to include in the summary. In the live SGE interface, this is reflected by the fact that the AI summary often mirrors particular facts or phrases found in the sources. Google even allows an expanded view that shows how the response is supported: when users expand the AI snapshot, they can see the evidence and context from the source pages that corroborate the answer
blog.google
. In essence, SGE is performing a kind of real-time snippet extraction similar to a very advanced featured snippet: it finds the relevant passages on each page and weaves them together into a cohesive answer. (For example, if one page lists the height of a mountain and another provides historical context, the snapshot will incorporate both pieces, each pulled from the respective source.) This snippet-oriented approach means each part of the AI’s answer is grounded in an actual web document.
Transparency & Traceability: Google SGE provides source citations to ensure transparency, though the presentation differs from a traditional footnote system. Beneath the AI-generated summary, SGE displays links to the websites it drew from – typically a small carousel or list of a few source pages (with the site names or titles visible)
seranking.com
. For example, you might see “Learn more from: Wikipedia – ExampleBlog.com – NewsSite.com” under the answer, indicating those sources were used. Each of those is clickable, driving the user to the original content. In the default condensed view, SGE does not mark exactly which sentence came from which source (unlike Bing or Perplexity’s explicit footnotes)
seranking.com
. This has drawn some criticism from power users, as it’s not immediately clear which fact is from where. However, Google offers an enhanced attribution on interaction: by clicking a expand icon or hovering, users can “expand your view to see how the response is corroborated”
blog.google
. In the expanded mode, the interface will highlight portions of the answer and show the matching evidence from the source, or list more sources (SGE snippets can have many links embedded, often 8 or more in an expanded answer)
seranking.com
seranking.com
. In short, SGE ensures the user can trace information back to sources, but the traceability is a two-step process – initial summary with a few source links for overview, and an optional expanded view for detailed citation-by-citation verification. Google’s goal is to maintain trust, so it clearly notes that the snapshot “cites the web pages it draws from” and encourages clicking through for verification
wsiworld.com
.
OpenAI’s Integrated Search (ChatGPT + Web Browsing)
Source Selection Algorithm: When ChatGPT’s browsing/search mode is enabled, the system delegates the initial search task to Bing’s search engine. Upon receiving a user query, ChatGPT formulates a keyword-based search query and submits it to Bing
academized.com
. It then obtains search results (the list of relevant webpages) which are ranked by Bing’s standard algorithms. From these results, the AI will typically click on one or several of the top hits and retrieve the content of those pages. The selection of which results to actually read is governed by the model’s judgment of relevance – for example, it may choose the first result unless it looks off-topic, or it might open multiple results if one alone doesn’t cover the question. In essence, ChatGPT relies on the external search engine’s ranking for primary source discovery, then uses its own reading comprehension to decide which pages/snippets contain the answer. This process ensures that the sources it cites are those that a current web search deems relevant (often news sites, Wikipedia, etc., depending on the query).
Retrieval vs. Generation Timing: ChatGPT with browsing is a retrieval-augmented generation system: it retrieves information before and while composing the answer. The model doesn’t produce final answers until it has fetched some content to ground them. Internally, the ChatGPT agent will perform a sequence like: search → retrieve page text → read/parse text → formulate answer. The citations are thus gathered ahead of answer generation and inserted as the answer is written. In practice, the ChatGPT model is instructed to incorporate references: “ChatGPT delivers timely answers with inline citations by integrating web search capabilities”
academized.com
. This means as the model generates each factual sentence, it knows the source (from the retrieved text) and attaches a citation. It’s not doing a post-hoc lookup after writing an answer; rather, it uses the retrieved snippets in real time to craft a factually-supported response. This approach is very much in line with OpenAI’s WebGPT research, where GPT-3 was fine-tuned to search the web and cite sources for its statements, which was shown to improve factual accuracy
medium.com
. ChatGPT’s live system inherits this philosophy, ensuring that any information beyond its training cutoff comes from a real-time web result and is credited accordingly.
Citation Ranking & Filtering: Because ChatGPT’s search results come from Bing, the ranking largely reflects Bing’s search algorithms (which consider factors like relevance, authority, freshness, etc.). ChatGPT will generally prioritize the top-ranked results – for example, it might start with the first result and only move to the second or third if needed (e.g., if the first result doesn’t fully answer the question or if the query is complex). The model might also merge info from multiple sources if beneficial. There isn’t an explicit “filter” step revealed to the user, but the model inherently avoids low-quality sources by following the search ranking and by selectively quoting material that seems credible. (If a top result is irrelevant or behind a paywall, the agent might skip it and move on.) In effect, the citations ChatGPT provides are often from well-known sites or directly relevant pages because those tend to rank highest on Bing. One can infer that ChatGPT’s browsing mode has some built-in safeguards to avoid dubious sources – for instance, it might refrain from using content that seems user-generated (forums, random blogs) unless the query specifically calls for it, favoring more authoritative content. However, it doesn’t have an explicit E-E-A-T weighting like Google; it’s as good as the search results it gets.
Evidence Granularity: Like others, ChatGPT’s web-enabled answers use passage-level evidence. The AI will extract or summarize specific passages from the pages it reads, rather than regurgitating an entire article. In the WebGPT prototype, the system navigated pages and could copy out relevant paragraphs to feed into the answer composer
medium.com
medium.com
. The modern ChatGPT likely does something similar under the hood: it might internally quote a snippet like “According to [Source], X is the tallest mountain in Europe at 5,642 meters” and then rephrase it in the answer. Each piece of the answer is grounded in something the model just saw on the web. This is confirmed by the fact that ChatGPT’s answers will often closely parallel the phrasing or data from the source material (with slight rewording), indicating it is indeed using the retrieved text. Consequently, the citations are tied to snippets within those source pages. If an answer draws from two different sources, you’ll see two different citations in the relevant parts of the answer. OpenAI’s documentation for their browsing API also notes that the model includes inline URL citations for content from search results
platform.openai.com
. The granular grounding means users can trust that each cited statement was found in the source text, not just inferred.
Transparency & Traceability: ChatGPT’s interface in browsing mode is designed for transparency. Inline citations (formatted as bracketed numbers like “[1]”) appear directly in the generated text, immediately following the facts or statements they support
academized.com
. For example, the answer might say “Elon Musk’s net worth is about $220 billion [1]” with [1] linking to a Forbes page. Users can hover over the citation to see a preview or the full URL of the source
academized.com
, and clicking it will open the source webpage. At the end of the answer, ChatGPT also provides a “Sources” list or button that, when clicked, reveals all the references used
academized.com
. This typically lists the site name or title and the link, similar to a reference section. The combination of inline context and a sources list makes it very straightforward to audit the answer. In essence, ChatGPT’s approach here is similar to Bing Chat’s: every claim is footnoted, and the user can explore those footnotes. This ensures traceability down to each detail – you can see which source contributed each piece of information. By making the citations hoverable/clickable, OpenAI allows users to verify content instantly, which addresses the trust issue of AI hallucination. Overall, OpenAI’s system is fully grounded in external sources when browsing, and it strives to make that grounding obvious: the design goal (as noted in one guide) is to make verification easier so that users “can easily verify sources and explore additional details”
academized.com
without leaving the chat unless they want to dive deeper.
Tavily
Source Selection Algorithm: Tavily is a web search API specifically optimized for AI agents and retrieval-augmented generation workflows. Its approach to source selection is to cast a wide net across multiple sources and then distill the relevant information from each. According to Tavily’s documentation, unlike a generic search engine, it “reviews multiple sources to find the most relevant content from each source, delivering concise, ready-to-use information optimized for LLM context.”
tavily.com
In practice, when you send a query to Tavily, it will search the web (using its own crawler/index and possibly aggregated results) and identify several pertinent documents. Rather than returning raw links or entire pages, Tavily immediately extracts the key content from those pages that answers the query. It essentially performs a meta-search and content extraction in one step. The algorithm likely uses a combination of keyword matching and semantic search (NLP techniques) to ensure it doesn’t miss contextually relevant pages. It also emphasizes trusted sources: Tavily’s site mentions using “trusted, authoritative sources” to guarantee relevant and accurate information
tavily.com
. So, much like Perplexity, Tavily is curating which sources to trust (for example, known news outlets, reference sites, etc.) and skipping irrelevant or low-quality pages. The end result is that for a given query, Tavily might pull, say, one paragraph from Britannica, another from a news article, and a definition from Wikipedia, if all three together answer the question.
Retrieval vs. Generation Timing: Tavily’s pipeline is firmly retrieval-first. It was “designed with AI workflows like Retrieval Augmented Generation in mind”
tavily.com
, meaning it expects to fetch information first and then have an LLM use that information. In fact, the Tavily API itself returns a synthesized answer alongside the sources, suggesting that Tavily has an answer-generation component built in. This implies that after retrieving the relevant content from multiple sources, Tavily likely uses an LLM (behind the scenes) to compile those pieces into a coherent answer before returning the response. All of this happens in one API call (within a couple of seconds). The citations are thus determined as part of that generation process – the system knows which source contributed which piece of the answer. (If one prefers, they could also ignore Tavily’s auto-generated answer and feed the returned snippets into a custom LLM, but the default behavior is to do both retrieval and generation for you.) Notably, Tavily’s commitment to citations means it never fabricates an answer without support; if no good source is found, it would have nothing factual to return. In summary, Tavily adheres to the RAG model: retrieve, then generate (with citations).
Citation Ranking & Filtering: Tavily returns an array of results with each API response, and each result includes the source URL, a title, and a snippet of content plus a relevance score
docs.tavily.com
docs.tavily.com
. This scoring is Tavily’s internal relevance metric (likely on a 0–1 scale) indicating how well that snippet answers the query. Tavily typically surfaces a small number of highly relevant sources rather than dozens of links – it aims to give just the information needed. The sources are filtered for quality and recency; Tavily’s marketing notes it retrieves “reliable, up-to-date information” for real-time queries
tavily.com
. It also allows some customization (developers can specify domain preferences or depth), but by default it tries to hit the main, trustworthy sources. In effect, Tavily’s citations are the top few sources that, collectively, answer the question. For example, for a query about a person, it might give Britannica and a recent news article. For a technical query, perhaps a StackExchange thread and documentation page. Each result is chosen to add something unique – if two sources were redundant, Tavily might include just one. The ranking (which source is listed first, second, etc.) is by the score (most relevant first). There isn’t an explicit “filter out low authority” knob exposed, but the design of Tavily inherently leans toward high-quality sources due to its intended use in accurate AI assistants.
Evidence Granularity: Tavily’s strength is in providing snippet-level evidence in a structured way. The API doesn’t dump whole webpages; instead, for each source it returns a short “content” excerpt which contains the answer or relevant fact
docs.tavily.com
. For instance, if the query is “Who is Lionel Messi?”, one result might have the content: “Lionel Messi, born in 1987, is an Argentine footballer widely regarded as one of the greatest players of his generation…”
docs.tavily.com
– essentially the key factual blurb from Britannica. By extracting just the necessary sentences from each source, Tavily ensures the LLM has focused, relevant context. The answer that Tavily generates is then grounded on those snippets. It might paraphrase or concatenate them, but because it had the snippet content available, it can directly cite those snippets. The grounding is at the snippet level: each sentence in the Tavily-generated answer is traceable to a specific piece of one of the returned content fields. (If a developer uses the raw results, they could themselves decide which snippet to use in an answer.) This approach is both efficient (smaller payload than full pages) and transparent. It’s similar to how an experienced researcher might quote just the pertinent line from an article rather than the whole text.
Transparency & Traceability: Tavily is “committed to transparency” – the documentation explicitly states that the API includes citations for all the information it retrieves
tavily.com
. In the JSON response, the answer is accompanied by the results list, so the source of each part of the answer is immediately available. Developers integrating Tavily can use this to display citations in the end-user application. For example, one could easily render the Tavily answer with superscript numbers pointing to the sources returned. The key point is that every detail in the answer can be traced to a cited URL. Tavily essentially does the citing for you: it pairs the answer and sources together, avoiding the scenario of a “black box” answer. Users of apps powered by Tavily would typically see an answer followed by references or footnote indicators. While Tavily itself is an API (not a consumer UI), its design mirrors best practices of citation: it provides the page title and URL, and even the exact snippet used, which the developer can show for context. This level of detail (returning the snippet text) helps with traceability – a user could be shown, say, a preview of the source content on hover. Since Tavily’s goal is to reduce hallucinations and increase trust in AI outputs
aiagentstore.ai
medium.com
, it ensures that nothing is stated without an accompanying reference. In summary, Tavily’s answers are fully source-backed; you know exactly where each piece of data came from, and you can click through to verify it in context. This transparent grounding is a key differentiator for Tavily as an “LLM-native” search solution.
Sources: The information above is drawn from official documentation, research blogs, and user reports for each platform. Perplexity’s approach is detailed by an SEO analysis of its architecture
ethanlazuk.com
ethanlazuk.com
and statements from the founders. Google’s SGE features are described in Google’s own blog and third-party examinations
wsiworld.com
wsiworld.com
. OpenAI’s search integration is summarized from OpenAI’s guides and the WebGPT research paper
medium.com
academized.com
. Tavily’s design is documented on its website and docs
tavily.com
tavily.com
. Each system takes a slightly different route, but all share a common goal: grounding AI-generated answers in trustworthy sources and making those sources accessible to users.

Nice—glad TRUE is wired up. Yes, you can make it a lot closer to what Perplexity/SGE/ChatGPT/Tavily do without losing the “content-first, no hardcoded domain scores” spirit. Here are the highest-impact upgrades, with concrete drop-ins.

1. Rank and select at the passage level (not page level)
   Per the research, everyone grounds answers in snippets. Do a quick passage BM25/TF-IDF rank per source and score the best passage against the query; feed those passages to the LLM.

Add backend/app/services/passage_ranker.py:

py
Copy
Edit

# lightweight passage search with pure Python fallback

import re
from math import log
from typing import List, Dict, Tuple

def \_tokenize(s: str) -> List[str]:
return re.findall(r"\w+", (s or "").lower())

def split_passages(text: str, window: int = 400, stride: int = 220) -> List[Tuple[int, str]]:
if not text: return []
chunks = []
for i in range(0, len(text), stride):
chunk = text[i:i+window]
if len(chunk) > 80: # skip tiny chunks
chunks.append((i, chunk))
return chunks

def bm25_best_passage(query: str, text: str) -> Dict:
q = \_tokenize(query)
if not q or not text:
return {"score": 0.0, "offset": 0, "text": ""}
chunks = split_passages(text) # naive BM25-ish scoring (no corpus IDF; use per-chunk TF with log dampening)
best = (0.0, 0, "")
for off, chunk in chunks:
toks = \_tokenize(chunk)
if not toks:
continue
tf = sum(toks.count(t) for t in set(q))
score = log(1 + tf) \* (1 + min(len(set(q)&set(toks))/max(1,len(set(q))), 1))
if score > best[0]:
best = (score, off, chunk)
return {"score": float(best[0]), "offset": best[1], "text": best[2][:800]}
Use it in TRUE selector (true_citation_selector.py), before scoring:

py
Copy
Edit
from .passage_ranker import bm25_best_passage

# inside select_citations loop:

p = bm25_best_passage(query, source.get("raw_text",""))
source["_best_passage"] = p # cache for composer/snippet alignment
passage_score = min(1.0, p["score"] / 6.0) # simple scale

# change composite:

composite*score = (
relevance_score * 0.45 + # page-level match
passage*score * 0.25 + # passage-level match (Perplexity/SGE style)
quality*score * 0.20 + # structure/depth
consensus*score* 0.10
)
This single change usually converts “0 citations” to clean, traceable, snippet-grounded citations.

2. Add a trust prior (soft, learned, and optional)
   Perplexity/SGE bias toward trusted domains—but do it learned, not hardcoded. Use signals you already have:

Cross-provider consensus: discovered_by count

Historical reliability: in Redis, how often a domain’s sources made it into evidence across past runs

Add a tiny helper backend/app/services/trust_prior.py:

py
Copy
Edit
from ..core.cache import CACHE

def domain_reliability(domain: str) -> float: # rolling, bounded [0.4..0.9] prior from past runs (citations / appearances)
key = CACHE.ai_key(f"trust:domain:{domain}:ratio")
try:
r = float(CACHE.get(key) or "0")
except:
r = 0.0
return 0.4 + max(0.0, min(0.5, r \* 0.5))

def update_domain_reliability(stats: dict): # call after a run completes: {domain: (appearances, cited)}
for d,(a,c) in stats.items():
if a <= 0: continue
ratio = c/a
CACHE.set(CACHE.ai_key(f"trust:domain:{d}:ratio"), str(min(1.0,max(0.0,ratio))), ttl=-1)
Blend it (opt-in) in TRUE selector:

py
Copy
Edit
import os
USE_TRUST = os.getenv("TRUE_USE_TRUST_PRIOR","false").lower() == "true"
from .trust_prior import domain_reliability

# inside loop:

trust = 0.5
if USE_TRUST:
dom = (source.get("domain") or "").lower()
providers = source.get("discovered_by") or source.get("search_providers") or []
consensus = 0.4 if len(providers)==1 else (0.6 if len(providers)==2 else 0.75)
trust = min(0.95, domain_reliability(dom)*0.6 + consensus*0.4)

# update composite weights slightly when enabled

if USE*TRUST:
composite_score = (
relevance_score * 0.40 +
passage*score * 0.25 +
quality*score * 0.20 +
trust \_ 0.15
)
This mirrors the “trust score + consensus” pattern in the research, yet remains configurable (default off preserves your “true” posture).

3. Dynamic K & diversity by intent (SGE-style)
   Make the number and mix of citations sensitive to query type:

py
Copy
Edit

# true_citation_selector.py

def target_citations_for(query: str) -> int:
q = query.lower()
if any(w in q for w in ["latest","today","2025","news","update"]): return 5 # current events
if any(w in q for w in ["how to","guide","setup","implement","api","error"]): return 4 # technical
return 3 # default

# when selecting:

k = target_citations_for(query)
selected = self.enforce_realistic_diversity(scored_sources, target_count=k)
Also tweak diversity caps for consumer/tech/academic intents (you already have patterns in the other selector; reuse them here).

4. Abstain when evidence is weak (Perplexity behavior)
   If the top passage score + coverage are low, return a guarded answer or defer.

py
Copy
Edit

# after selecting

avg*passage = sum(s["\_best_passage"]["score"] for s,* in scored_sources[:k]) / max(1,k)
if avg_passage < 1.5: # empirical
return [] # or mark insufficient and let composer handle abstention
And in composer.py, if selected_sources < k or total passage support low, produce a short “insufficient evidence” reply.

5. Generate from passages only and enforce per-sentence cites
   Feed the LLM only title + best_passage + url + source_id. If a sentence returns without source_ids, drop it (SGE/Perplexity do “integrated attribution” vs post-hoc).

py
Copy
Edit

# composer.py (build src_brief from passages)

src_brief = [{
"source_id": s["source_id"],
"title": s.get("title"),
"url": s.get("url"),
"domain": s.get("domain"),
"passage": s.get("\_best_passage",{}).get("text","")[:800]
} for s in selected_sources]

system = (
"Answer ONLY using the provided passages. "
"Every sentence MUST include 1–3 citations by source_id. "
"If a sentence is not directly supported, do not include it."
)

# after model returns

clean = []
for sent in data.get("sentences", []):
ids = sent.get("source_ids") or sent.get("sourceIds") or []
if ids: clean.append({"text": sent.get("text",""), "source_ids":[str(x) for x in ids]})
sentences = clean

# inline tokens so your UI renders them

answer_text = "\n".join(f"{s['text']} " + " ".join(s['source_ids']) for s in sentences)
This mirrors the “retrieval → compose with inline cites” pattern described.

6. Fix small correctness issues
   Consensus bug: you already noticed—use discovered_by when present in TRUE selector.

Date handling: prefer extracted published_at from fetch_parse.parse_main_text, fall back to provider. Improve calculate_freshness_score to handle TZ and malformed strings robustly (you already do most of this).

Max-same-domain: make it relative to k (e.g., max_same_domain = max(1, k-2)) so current-events answers can cite 2 links from the same outlet if they’re distinct updates.

7. Tighten filters (spam/boilerplate)
   Before scoring, quickly downrank pages with:

extremely short content (raw_text < 200)

high template/boilerplate ratio (e.g., repeated nav/footer n-grams)

clickbait in title (you already do)
That reduces false positives and aligns with the “trustworthiness thresholds”.

8. Store & learn from outcomes (lightweight)
   After each run, compute per-domain {appearances, cited} and call update_domain_reliability. Over time this approximates the “trust score” Perplexity uses, but derived from your pipeline’s experience.

What you’ll get after these changes
Selection is passage-grounded and intent-aware (Perplexity/SGE-like).

Optional trust prior + consensus improves safety without hardcoding a .gov whitelist.

Composer outputs only sentences with real backing; abstains when weak.

Front-end citations render reliably because you inline src\_… tokens.

If you want, I can draft the exact patches for true_citation_selector.py and composer.py matching your current function signatures—just say the word and I’ll paste them.

\_\_

awesome — here are the exact drop-in patches and two tiny helper files. They keep your current signatures intact and just make TRUE behave more like Perplexity/SGE while staying “content-first.”

1. New file: backend/app/services/passage_ranker.py
   python
   Copy
   Edit

# backend/app/services/passage_ranker.py

import re
from math import log
from typing import List, Dict, Tuple

def \_tokenize(s: str) -> List[str]:
return re.findall(r"\w+", (s or "").lower())

def split_passages(text: str, window: int = 400, stride: int = 220) -> List[Tuple[int, str]]:
if not text:
return []
chunks: List[Tuple[int, str]] = []
for i in range(0, len(text), stride):
chunk = text[i:i + window]
if len(chunk) > 80: # skip tiny chunks
chunks.append((i, chunk))
return chunks

def bm25_best_passage(query: str, text: str) -> Dict:
"""
Lightweight, corpus-free BM25-ish scoring to find the best passage in a single document.
Returns: {"score": float, "offset": int, "text": str}
"""
q = \_tokenize(query)
if not q or not text:
return {"score": 0.0, "offset": 0, "text": ""}

    chunks = split_passages(text)
    best = (0.0, 0, "")
    for off, chunk in chunks:
        toks = _tokenize(chunk)
        if not toks:
            continue
        # crude TF (per chunk) with log dampening; small coverage bonus
        tf = sum(toks.count(t) for t in set(q))
        coverage = len(set(q) & set(toks)) / max(1, len(set(q)))
        score = log(1 + tf) * (1 + min(1.0, coverage))
        if score > best[0]:
            best = (score, off, chunk)

    return {"score": float(best[0]), "offset": best[1], "text": best[2][:800]}

2. New file: backend/app/services/trust_prior.py
   python
   Copy
   Edit

# backend/app/services/trust_prior.py

from typing import Dict, Tuple
from ..core.cache import CACHE

def domain_reliability(domain: str) -> float:
"""
Rolling prior in [0.4 .. 0.9] based on (citations / appearances) learned from your own runs.
"""
if not domain:
return 0.5
key = CACHE.ai_key(f"trust:domain:{domain.lower()}:ratio")
try:
r = float(CACHE.get(key) or "0")
except Exception:
r = 0.0
return 0.4 + max(0.0, min(0.5, r \* 0.5)) # compress toward middle, cap at 0.9

def update_domain_reliability(stats: Dict[str, Tuple[int, int]]) -> None:
"""
stats: {domain: (appearances, cited)}
Call once per run to update priors.
"""
for d, (appearances, cited) in stats.items():
if appearances <= 0:
continue
ratio = max(0.0, min(1.0, cited / appearances))
CACHE.set(CACHE.ai_key(f"trust:domain:{d.lower()}:ratio"), str(ratio), ttl=-1)
(You can wire update_domain_reliability at the end of your run if you want the priors to learn over time. Optional.)

3. Patch: backend/app/services/true_citation_selector.py
   diff
   Copy
   Edit
   \*\*\* a/backend/app/services/true_citation_selector.py
   --- b/backend/app/services/true_citation_selector.py
   @@
   -"""
   -True AI Citation Selector - NO hardcoded domain scores!
   -Based on actual content quality and query relevance like real AI search engines.
   -"""
   +"""
   +True AI Citation Selector - content-first citation selection with passage grounding.
   +Adds:

- - best-passage scoring (Perplexity/SGE style)
- - optional trust prior blended with consensus (no hardcoded domain lists)
- - intent-aware K (how many citations) and gentler diversity by query type
    +"""

import re
from typing import List, Dict, Any, Set, Tuple
from collections import defaultdict, Counter
import math
+import os
+from .passage_ranker import bm25_best_passage
+from .trust_prior import domain_reliability

class TrueCitationSelector:
def **init**(self):

-        # NO hardcoded domain scores! Only diversity requirements

*        # diversity defaults; some are adjusted dynamically based on K
         self.diversity_requirements = {
             "minimum_diversity": 3,  # At least 3 different domain types

-            "max_same_domain": 3,    # Max 3 citations from same domain

*            "max_same_domain": 3,    # default; will scale with target_count
             "prefer_different_tlds": True
         }
*        self.use_trust_prior = os.getenv("TRUE_USE_TRUST_PRIOR", "false").lower() == "true"

* # --- intent heuristics (SGE-like) ---
* def target_citations_for(self, query: str) -> int:
*        q = (query or "").lower()
*        if any(w in q for w in ["latest", "today", "breaking", "now", "2024", "2025", "news", "update"]):
*            return 5
*        if any(w in q for w in ["how to", "guide", "setup", "implement", "api", "error", "fix", "configure"]):
*            return 4
*        if any(w in q for w in ["compare", "vs", "pros", "cons", "which", "best"]):
*            return 4
*        return 3

@@

- def calculate_consensus_score(self, source: Dict[str, Any]) -> float:
-        """Multi-provider consensus - sources found by multiple engines are better"""
-        provider_count = len(source.get('search_providers', []))

* def calculate_consensus_score(self, source: Dict[str, Any]) -> float:
*        """Multi-provider consensus - sources found by multiple engines are better"""
*        providers = source.get('search_providers') or source.get('discovered_by') or []
*        provider_count = len(providers)

           if provider_count >= 3:
               return 1.0  # Strong consensus
           elif provider_count == 2:
               return 0.75  # Good consensus
           else:
               return 0.5   # Single provider

  @@
  def enforce_realistic_diversity(self, scored_sources: List[Tuple[Dict[str, Any], float]],

-                                   target_count: int = 10) -> List[Dict[str, Any]]:

*                                   target_count: int = 10) -> List[Dict[str, Any]]:
         """Enforce diversity like real AI search engines - NO domain authority bias"""

         if not scored_sources:
             return []

         # Sort by composite score
         scored_sources.sort(key=lambda x: x[1], reverse=True)

         selected = []
         domain_counts = defaultdict(int)
         domain_type_counts = defaultdict(int)
         used_domains = set()

*        # scale cap by K (allow a bit more from same domain when K is small)
*        dynamic_cap = max(1, min(self.diversity_requirements['max_same_domain'], target_count - 1))

         # First pass: Select top sources with diversity constraints
         for source, score in scored_sources:
             if len(selected) >= target_count:
                 break

             domain = source.get('domain', '').lower()
             domain_type = self.get_domain_type(domain)

             # Skip if we already have too many from this domain

-            if domain_counts[domain] >= self.diversity_requirements['max_same_domain']:

*            if domain_counts[domain] >= dynamic_cap:
                   continue

               # Prefer different domain types for diversity
               if len(selected) >= 3:  # After first 3, enforce diversity
                   # Skip if we have too many of this domain type
                   if domain_type_counts[domain_type] >= 4:
                       continue

  @@

- def select_citations(self, query: str, sources: List[Dict[str, Any]],
-                        target_count: int = 10) -> List[Dict[str, Any]]:

* def select_citations(self, query: str, sources: List[Dict[str, Any]],
*                        target_count: int = 10) -> List[Dict[str, Any]]:
           """
           Select citations based PURELY on content quality and query relevance.
           NO hardcoded domain authority scores!
           """
           if not sources:
               return []

           print(f"[DEBUG] Citation selector processing {len(sources)} sources")

  @@

-        scored_sources = []

*        # intent-aware K override if caller left default
*        if target_count == 10:
*            target_count = self.target_citations_for(query)
*
*        scored_sources: List[Tuple[Dict[str, Any], float]] = []

         for source in sources:
             # Pure content-based scoring
             relevance_score = self.calculate_content_relevance_score(query, source)
             quality_score = self.calculate_content_quality_score(source)
             consensus_score = self.calculate_consensus_score(source)

*            # Passage-level evidence (best passage)
*            bestp = bm25_best_passage(query, source.get("raw_text", ""))
*            source["_best_passage"] = bestp
*            passage_score = min(1.0, bestp["score"] / 6.0)  # simple scaling

-            # Composite score: relevance is king, quality matters, consensus helps
-            composite_score = (
-                relevance_score * 0.6 +    # Query relevance is primary
-                quality_score * 0.3 +      # Content quality
-                consensus_score * 0.1      # Multi-provider consensus
-            )

*            # Optional trust prior blended with consensus (still content-first)
*            trust = 0.5
*            if self.use_trust_prior:
*                dom = (source.get("domain") or "").lower()
*                trust = min(0.95, domain_reliability(dom) * 0.6 + consensus_score * 0.4)
*
*            # Composite score (passage grounded)
*            if self.use_trust_prior:
*                composite_score = (
*                    relevance_score * 0.40 +
*                    passage_score  * 0.25 +
*                    quality_score  * 0.20 +
*                    trust          * 0.15
*                )
*            else:
*                composite_score = (
*                    relevance_score * 0.45 +
*                    passage_score  * 0.25 +
*                    quality_score  * 0.20 +
*                    consensus_score* 0.10
*                )

             scored_sources.append((source, composite_score))

             # Debug top scoring sources
             if composite_score > 0.7:
                 domain = source.get('domain', 'unknown')
                 title = source.get('title', 'No title')[:50]
                 print(f"[DEBUG] High score {composite_score:.2f}: {domain} - {title}")

         print(f"[DEBUG] Scored {len(scored_sources)} sources, selecting {target_count}")

         # Apply diversity constraints

-        selected = self.enforce_realistic_diversity(scored_sources, target_count)

*        selected = self.enforce_realistic_diversity(scored_sources, target_count)

         print(f"[DEBUG] Selected {len(selected)} diverse sources")
         for source in selected[:5]:  # Show first 5
             domain = source.get('domain', 'unknown')
             domain_type = self.get_domain_type(domain)
             print(f"[DEBUG] Selected: {domain} ({domain_type})")

         return selected

4. Patch: backend/app/services/composer.py
   diff
   Copy
   Edit
   \*\*\* a/backend/app/services/composer.py
   --- b/backend/app/services/composer.py
   @@
   try:
   from .true_citation_selector import TRUE_CITATION_SELECTOR
   print("[COMPOSER DEBUG] TRUE_CITATION_SELECTOR imported successfully")
   except Exception as e:
   print(f"[COMPOSER DEBUG] IMPORT ERROR: {e}")
   TRUE_CITATION_SELECTOR = None
   @@
   def compose_answer(query: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
   @@

- # Use TRUE citation selection - NO hardcoded domain scores!
- print(f"[COMPOSER DEBUG] Starting citation selection with {len(sources)} sources")
-
- # TEMPORARY: Force bypass citation selector to test if server restart needed
- print(f"[COMPOSER DEBUG] FORCING BYPASS - Using first {min(10, len(sources))} sources directly")
- selected_sources = sources[:10]
-
- # Minimum source check (much more lenient than old authority floor)
- min_sources = max(1, int(os.getenv("MIN_AUTHORITY_SOURCES", "2")))

* # TRUE citation selection with passage grounding
* print(f"[COMPOSER DEBUG] Starting citation selection with {len(sources)} sources")
* desired_k = 3
* if TRUE_CITATION_SELECTOR:
*        try:
*            desired_k = TRUE_CITATION_SELECTOR.target_citations_for(query)
*        except Exception:
*            desired_k = 3
* if TRUE_CITATION_SELECTOR:
*        selected_sources = TRUE_CITATION_SELECTOR.select_citations(query, sources, target_count=desired_k)
*        if not selected_sources:
*            selected_sources = sources[:desired_k]
* else:
*        selected_sources = sources[:desired_k]
*
* # Minimum source check (lenient)
* min_sources = max(1, int(os.getenv("MIN_AUTHORITY_SOURCES", "1")))
  print(f"[COMPOSER DEBUG] Min sources required: {min_sources}, Selected sources: {len(selected_sources)}")

  if len(selected_sources) < min_sources:
  print(f"[COMPOSER DEBUG] INSUFFICIENT SOURCES - returning error")
  return {
  "answer_text": f"Insufficient relevant sources found to provide a comprehensive answer. Found {len(selected_sources)} suitable sources, but require at least {min_sources} for reliable information.",
  "sentences": [],
  "insufficient_sources": True,
  "sources_found": len(selected_sources),
  "min_required": min_sources,
  "available_sources": len(sources)
  }

- print(f"[COMPOSER DEBUG] Proceeding to LLM with {len(selected_sources)} sources")

* # Simple abstain heuristic if passages are weak
* try:
*        avg_pass = sum((s.get("_best_passage", {}) or {}).get("score", 0.0) for s in selected_sources) / max(1, len(selected_sources))
* except Exception:
*        avg_pass = 0.0
* if avg_pass < 1.2 and len(selected_sources) < 2:
*        return {
*            "answer_text": "I couldn’t find strong, directly relevant passages to answer this confidently.",
*            "sentences": [],
*            "insufficient_sources": True,
*            "available_sources": len(sources)
*        }
*
* print(f"[COMPOSER DEBUG] Proceeding to LLM with {len(selected_sources)} sources (k={desired_k})")

  # Format selected sources for the model

  src_brief = [
  {
  "source_id": s["source_id"],
  "title": s.get("title"),
  "domain": s.get("domain"),
  "url": s.get("url"),

-            "category": s.get("category", "unknown"),
-            "credibility_score": s.get("credibility", {}).get("score", 0.5),
-            "credibility_band": s.get("credibility", {}).get("band", "C"),
-            "snippet": (s.get("raw_text") or s.get("title") or "")[:800],

*            # composer is STRICTLY passage-grounded:
*            "passage": (s.get("_best_passage") or {}).get("text") or (s.get("raw_text") or "")[:800],
         }
         for s in selected_sources

  ]

  system = (

-        "You are a precise research assistant. Answer the user's query using the provided sources. "
-        "Every sentence in your answer must include one or more citations referencing source_id values. "
-        "\n**TRUE AI SEARCH APPROACH:**\n"
-        "- Sources selected PURELY by content relevance and quality - NO domain authority bias\n"
-        "- Mix includes: government, academic, commercial, news, community sources based on content value\n"
-        "- A tech company blog may be more valuable than a random .edu page for tech queries\n"
-        "- Community sources (Reddit, Stack Overflow) can provide practical insights\n"
-        "- Commercial sources offer real-world implementation details\n"
-        "\nUse all provided sources - they were chosen for content quality and query relevance. "
-        "Cite 2-4 sources per sentence when available. Mix source types naturally based on what information they provide. "
-        "Return strict JSON with keys: answer_text, sentences[]. Each sentences[] item has text and source_ids[]."

*        "You are a precise research assistant. Use ONLY the provided passages to answer the user's query.\n"
*        "- Every sentence MUST include 1–3 citations referencing source_id values.\n"
*        "- If a statement is not directly supported by a passage, do not include it.\n"
*        "- Keep it concise (3–6 sentences), factual, and grounded.\n"
*        "Return strict JSON with keys: answer_text, sentences[]. Each sentences[] item has text and source_ids[]."
       )
       user = {
           "query": query,
           "sources": src_brief,
           "instructions": "Compose 3-6 sentences. Keep to facts supported by sources."
       }
  @@
  content = resp.choices[0].message.content
  data = json.loads(content)

- # Validate minimal shape
- answer_text = data.get("answer_text") or ""
- sentences = data.get("sentences") or []
- if not isinstance(sentences, list):
-        sentences = []
- # Normalize source_ids to strings
- for s in sentences:
-        ids = s.get("source_ids") or []
-        s["source_ids"] = [str(x) for x in ids]
- return {"answer_text": answer_text, "sentences": sentences}

* # Normalize shape & keys (handle sourceIds / citations / numeric indices)
* raw_sentences = data.get("sentences") or data.get("Sentences") or []
* sentences = []
* id_map = {i + 1: s["source_id"] for i, s in enumerate(selected_sources)}
* for item in raw_sentences:
*        ids = item.get("source_ids") or item.get("sourceIds") or item.get("citations") or []
*        # map numeric refs (1-based) to source_ids
*        if ids and all(isinstance(x, (int, float)) for x in ids):
*            ids = [id_map.get(int(x)) for x in ids if id_map.get(int(x))]
*        ids = [str(x) for x in ids if x]
*        if ids and (item.get("text") or "").strip():
*            sentences.append({"text": item["text"].strip(), "source_ids": ids})
*
* # Inline src\_ tokens for the front-end renderer
* answer_text = "\n".join(f"{s['text']} " + " ".join(s['source_ids']) for s in sentences)
* return {"answer_text": answer_text, "sentences": sentences}
  That’s it
  What changes immediately:
  TRUE now grades sources by best passage against the query (and stores it at \_best_passage).

Optional trust prior (off by default) blends historical domain reliability + consensus.

K (number of citations) adapts to intent (news/“how to”/compare).

Composer uses passages only, enforces per-sentence citations, and inlines src\_… tokens so your UI will show links even if the model didn’t embed them.

Numeric citation lists like [1,2] from the model are mapped back to your source_ids.

If you want, I can also wire the update_domain_reliability(...) call to run after evidence is written so the trust prior learns as you use the system.

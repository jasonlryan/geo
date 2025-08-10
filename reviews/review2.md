You’re not crazy to be surprised — most of those are vendor/marketing pages, not the kinds of sources you’d _expect_ to see cited for “AI leadership.” The pattern actually makes sense given how your pipeline is currently wired and how Tavily ranks by default. Here’s what’s going on and how to tighten it up.

# What you’re seeing (tl;dr)

- Your run is skewing toward **recent, well‑SEO’d corporate posts** (Atlassian, IBM, Phenom, AlphaBOLD, etc.) plus one academic item (Springer) that your categorizer mislabeled as “corporate.”
- The bias comes from three places: **query expansion**, **search settings**, and **how your composer picks citations**.

# Why your pipeline picks these

1. **Query expansion biases the result set.**
   Your `expand_queries` adds `" 2025"` and `"latest …"` to the base query. That tends to surface “Top trends 2025 / Best practices” style posts — which are overwhelmingly corporate blogs. (See `services/search_pipeline.py`.)

2. **Search settings favor breadth over authority.**
   The Tavily provider is called with `search_depth = "basic"` by default and no domain filters. Basic depth is faster/cheaper but less picky; “advanced” applies extra post‑processing for relevance. Without include/exclude domain constraints, well‑optimized vendor posts often bubble up. ([Tavily Community][1], [LangChain][2])

3. **You fetch the first pages that rank, then pass short snippets to the LLM.**
   `fetch_parse.parse_main_text` is a stub that returns the **first \~2,000 chars** of HTML. Corporate “best practices” pages usually have clean intros and bullet lists right at the top — perfect for the composer to lift, while research/policy pages may hide the good stuff deeper or in PDFs.

4. **The composer doesn’t know “authority.”**
   The answer prompt asks for multiple independent sources but **doesn’t weight by credibility**. Every source is handed to the model with the same default `credibility.score: 0.6`, so a Fortune‑500 blog post and a peer‑reviewed article look equivalent. (See `services/composer.py` and how sources are built in `routers/search.py`.)

5. **Category mislabels amplify the impression.**
   Your `categorize_source` doesn’t recognize **Springer** as “research,” so `link.springer.com` fell into “corporate.” That makes the set look even more vendor‑heavy than it actually is. (See `utils/source_categorization.py` — it doesn’t include springer/nature/ieee/etc. in the research patterns.)

# What these sites are doing “right” (from an AI/search POV)

- **Title + year alignment:** “How to…”, “Top X trends”, “Best practices”, “2025” in the title — dead‑on lexical matches to your expanded queries.
- **Highly scannable structure:** H2s, lists, key takeaways near the top. Your stub parser and the composer reward this format.
- **Freshness signals:** Many of these pages are dated 2025; Tavily can use recency and relevance scoring when ranking. ([LangChain][2])
- **No paywalls / fast pages:** Easy to fetch and parse means they survive your fetch step and provide clean snippets.
- **Domain authority (SEO sense, not academic):** Big vendor domains (ibm.com, atlassian.com) tend to rank and be crawled/retrieved consistently.

# Is Tavily “reliable”?

- **What Tavily promises:** a search API tuned for LLM/RAG; it can run at **basic** or **advanced** depth, and supports knobs like `max_results`, `time_range`, `include_raw_content`, and (via SDK/wrappers) domain filtering. It’s integrated in frameworks like LangChain specifically for LLM pipelines. ([Tavily Docs][3], [LangChain][2])
- **What that means in practice:** Tavily is solid for _finding_ relevant, fresh web pages quickly, but **it will mirror the web** — if your query and settings are broad, you’ll see a lot of polished corporate content. Reliability for _research‑grade citations_ depends on **how you constrain and re‑rank** the results you feed to the model. (Their own guidance and community answers emphasize tuning depth/filters and post‑processing.) ([Tavily Docs][4], [Tavily Community][1])
- **FYI:** Tavily can also return parsed `raw_content` directly (one‑step extraction) if you enable it, with a trade‑off in latency; that often produces better text than a home‑rolled “first 2,000 chars” slice. ([Tavily Docs][5])
- A third‑party write‑up characterizes Tavily as a “search‑first” aggregator with separate extraction/crawl endpoints — i.e., you’re expected to add your own reranking/filters for your use case. ([Apify Blog][6])

# Quick fixes you can try today (no refactor)

1. **Tighten the query.**
   Add qualifiers that force higher‑authority sources:

   - `("AI leadership" OR "responsible AI leadership") (site:.gov OR site:.edu OR site:.org) (report OR policy OR white paper OR "peer‑reviewed" OR pdf)`
     This single change reduces “trends/principles” blogspam dramatically.

2. **Turn up search quality.**
   Set `TAVILY_SEARCH_DEPTH=advanced` and consider `time_range="year"` for freshness. (Advanced depth applies extra post‑processing for relevance.) ([Tavily Community][1])

3. **Use domain filters.**
   Tavily integrations support `include_domains` / `exclude_domains`. For leadership, include whitelists (e.g., **hbr.org, mitsloan.mit.edu, nature.com, springer.com, ieee.org, oecd.org**), and/or exclude generic marketing hosts. ([LangChain][7])

4. **Get better text.**
   Ask Tavily for `include_raw_content=true` (or call their Extract endpoint) instead of slicing HTML yourself; you’ll feed the LLM cleaner, main‑content text. ([Tavily Docs][5])

5. **Fix the mislabels right away.**
   Add patterns for `springer`, `nature`, `ieee`, `acm`, `sciencedirect`, `sagepub`, `tandfonline`, `jstor` in `categorize_source()` so research isn’t lumped into “corporate.”

# Slightly bigger (but high‑leverage) improvements

- **Re‑rank before composing.**
  Add a lightweight scorer so the top N you pass to the composer favor authority and recency:
  `score = 0.5*authority + 0.2*recency + 0.3*topical_overlap`

  - Authority: map your categories → a baseline (gov/edu/research ≈ 0.9; news/financial ≈ 0.7; corporate ≈ 0.5; blog/social lower).
  - Recency: classify with your existing `classify_recency()` and give small boosts for “recent/medium.”
  - Topical overlap: simple BM25/keyword overlap or an embedding cosine.

- **Let the LLM see authority signals.**
  In `compose_answer`, pass `credibility.score`, `source_category`, and `published_at` to the model and **change the system prompt** to:
  “_Prefer citing .gov/.edu/peer‑reviewed sources; require at least one high‑authority citation per sentence when available; avoid citing corporate blogs unless they contain primary data or unique guidance._”
  Right now the model can’t tell IBM vs. Springer apart — you have to tell it.

- **Broaden providers & dedupe by policy.**
  Keep Tavily (it’s fast and LLM‑friendly) but add a second provider or a curated list for leadership topics, then **interleave + re‑rank** (e.g., keep only one result per domain until you’ve included ≥1 gov/edu/research).

- **Parse properly.**
  Replace the stub parser with readability/trafilatura or use Tavily’s extraction so you’re citing the body, not headers/menus. ([Tavily Docs][5])

# A note on your specific list

- **IBM, Atlassian**: high domain authority + clean “principles/best practices” pages.
- **Unicorn Labs, AlphaBOLD, Phenom, VIDIZMO, Disprz, Nucamp**: well‑targeted titles with “leadership,” “responsible AI,” “2025,” plus scannable lists.
- **Springer**: this _is_ a scholarly item; it was just categorized as “corporate” by your heuristic rules.

If you want, I can draft the exact code edits (env knobs + a tiny reranker + category fixes + prompt tweak) so your next run trends toward HBR/MIT Sloan/OECD/Nature‑type citations instead of vendor blogs.

[1]: https://community.tavily.com/t/how-to-interpret-search-depth-parameter-what-does-advanced-mean/502?utm_source=chatgpt.com "How to interpret search_depth parameter? What does advanced ..."
[2]: https://python.langchain.com/docs/integrations/tools/tavily_search/?utm_source=chatgpt.com "Tavily Search - ️ LangChain"
[3]: https://docs.tavily.com/documentation/api-reference/endpoint/search?utm_source=chatgpt.com "Tavily Search - Tavily Docs"
[4]: https://docs.tavily.com/documentation/best-practices/best-practices-search?utm_source=chatgpt.com "Best Practices for Search - Tavily Docs"
[5]: https://docs.tavily.com/documentation/best-practices/best-practices-extract?utm_source=chatgpt.com "Best Practices for Extract - Tavily Docs"
[6]: https://blog.apify.com/firecrawl-vs-tavily/?utm_source=chatgpt.com "Firecrawl vs. Tavily for RAG and agent pipelines - Apify Blog"
[7]: https://python.langchain.com/api_reference/community/utilities/langchain_community.utilities.tavily_search.TavilySearchAPIWrapper.html?utm_source=chatgpt.com "TavilySearchAPIWrapper — LangChain documentation"

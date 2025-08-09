import os
import json
import asyncio
from typing import List

from ..search_openai import openai_client
from .base import SearchProvider, ProviderResult


class OpenAISearchProvider(SearchProvider):
    name = "openai"

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        """
        Uses OpenAI to propose likely relevant URLs and titles for the query.
        This is not true web search but a practical starting point that avoids
        extra provider keys. We then fetch the pages downstream.
        """

        def _call_llm() -> List[ProviderResult]:
            client = openai_client()
            model = os.getenv("OPENAI_MODEL_SEARCH", "gpt-4o-mini")
            system = (
                "You suggest likely relevant, high-quality public URLs for a user query. "
                "Return strict JSON: {\n  \"results\": [ {\"title\": str, \"url\": str, \"snippet\": str|null } ]\n}. "
                "Prefer authoritative sources (gov/edu/reputable news/docs)."
            )
            user = {"query": query, "limit": limit}
            resp = client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(user)},
                ],
                temperature=0.2,
            )
            content = resp.choices[0].message.content
            data = json.loads(content)
            out: List[ProviderResult] = []
            for r in (data.get("results") or [])[:limit]:
                title = (r.get("title") or "").strip()
                url = (r.get("url") or "").strip()
                snippet = r.get("snippet")
                if not url:
                    continue
                out.append(ProviderResult(title=title or url, url=url, snippet=snippet, provider=self.name))
            return out

        try:
            return await asyncio.to_thread(_call_llm)
        except Exception:
            return []


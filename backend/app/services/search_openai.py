import os
from typing import Any, Dict, List

from openai import OpenAI


def openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


def web_search(query: str, max_results: int = 6) -> List[Dict[str, Any]]:
    """
    Placeholder for OpenAI "search" style call. Until GA, we mock results here or
    you can adapt to your available tool (e.g., Tavily via function call, or
    OpenAI responses with web tool enabled if you have access).
    """
    # For now, return an empty list to keep the plumbing simple.
    # Integrators can replace this with actual OpenAI web search tools or providers.
    return []


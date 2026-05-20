"""Shared env loading and Anthropic client wiring for Atlas agents.

`load_dotenv(override=True)` is deliberate — the Claude Code shell environment
appears to seed ANTHROPIC_API_KEY as empty, which would otherwise shadow the
real value in .env.
"""

from __future__ import annotations

import os
from functools import lru_cache

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv(override=True)

DEFAULT_MODEL: str = os.environ.get(
    "ATLAS_DEFAULT_MODEL", "claude-haiku-4-5-20251001"
)


@lru_cache(maxsize=1)
def get_client() -> Anthropic:
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key.startswith("sk-ant-"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY missing or malformed. "
            "Copy .env.example to .env and paste a real key from console.anthropic.com."
        )
    # max_retries=5 to ride out transient 529 (overloaded) and 5xx errors;
    # SDK uses exponential backoff internally.
    return Anthropic(api_key=key, max_retries=5)

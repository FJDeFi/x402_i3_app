#!/usr/bin/env python3
"""
Generate model-embeddings.json using the I3 Proxy embeddings API.
Source text is built from model-data.js: name + purpose + useCase (+ category/industry as context).

Usage:
  I3_API_KEY=... python3 scripts/gen_model_embeddings.py [--base http://localhost:8000]
"""

import os
import re
import sys
import json
import time
import argparse
from pathlib import Path
import urllib.request


def load_model_data(js_path: Path) -> dict:
    """Parse model-data.js and extract {name: {purpose, useCase, category, industry}}"""
    content = js_path.read_text(encoding="utf-8")
    # Regex similar to backend, tolerant of escaped quotes/newlines
    pattern = r'"([^"\\]+)":\s*\{\s*"purpose":\s*"([^"\\]*(?:\\.[^"\\]*)*)",\s*"useCase":\s*"([^"\\]*(?:\\.[^"\\]*)*)",\s*"category":\s*"([^"\\]*)",\s*"industry":\s*"([^"\\]*)"'
    models = {}
    for match in re.finditer(pattern, content, re.DOTALL):
        name = match.group(1)
        def clean(s: str) -> str:
            s = s.replace('\\"', '"').replace('\\n', ' ').replace('\n', ' ')
            # strip HTML tags if any
            s = re.sub(r'<[^>]+>', '', s)
            return s.strip()

        purpose = clean(match.group(2))
        use_case = clean(match.group(3))
        category = match.group(4).strip()
        industry = match.group(5).strip()
        models[name] = {
            "purpose": purpose,
            "useCase": use_case,
            "category": category,
            "industry": industry,
        }
    if not models:
        raise RuntimeError("No models parsed from model-data.js")
    return models


def build_card_text(name: str, d: dict) -> str:
    parts = [name]
    if d.get("purpose"):
        parts.append(d["purpose"]) 
    if d.get("useCase"):
        parts.append(d["useCase"]) 
    # Include category/industry to give more context for similarity
    if d.get("category"):
        parts.append(f"Category: {d['category']}")
    if d.get("industry"):
        parts.append(f"Industry: {d['industry']}")
    return "\n".join(parts)


def post_embeddings(base_url: str, api_key: str, texts: list) -> list:
    url = f"{base_url.rstrip('/')}/embeddings"
    payload = {
        "model": "i3-embedding",
        "input": texts,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "I3-API-Key": api_key,
    })
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
    j = json.loads(body)
    # Expect proxy shape
    items = j.get("data", {}).get("data", [])
    return [item.get("embedding", []) for item in items]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=os.environ.get("I3_PROXY_BASE", "http://localhost:8000"))
    args = parser.parse_args()

    api_key = os.environ.get("I3_API_KEY")
    if not api_key:
        print("Missing I3_API_KEY", file=sys.stderr)
        sys.exit(1)

    root = Path(__file__).resolve().parents[1]
    js_path = root / "model-data.js"
    out_path = root / "model-embeddings.json"

    models = load_model_data(js_path)
    names = list(models.keys())
    print(f"Parsed {len(names)} models from {js_path}")

    # Build texts
    items = [(name, build_card_text(name, models[name])) for name in names]

    out = []
    BATCH = 64
    for i in range(0, len(items), BATCH):
        batch = items[i:i+BATCH]
        texts = [t for _, t in batch]
        embs = post_embeddings(args.base, api_key, texts)
        if len(embs) != len(batch):
            raise RuntimeError(f"Embedding count mismatch at batch {i}: got {len(embs)} expected {len(batch)}")
        for (name, _), emb in zip(batch, embs):
            out.append({"name": name, "embedding": emb})
        print(f"Embedded {min(i+BATCH, len(items))} / {len(items)}")
        time.sleep(0.1)

    out_path.write_text(json.dumps(out), encoding="utf-8")
    print(f"Wrote {out_path} items: {len(out)}")


if __name__ == "__main__":
    main()






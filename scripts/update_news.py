#!/usr/bin/env python3
"""Fetch only publication metadata from the Receita Federal public Atom feed."""
from __future__ import annotations

import json
import os
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "noticias.json"
FEED_URL = "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/ultimas-noticias/RSS"
ATOM = "{http://www.w3.org/2005/Atom}"


def text_of(parent: ET.Element, name: str) -> str:
    node = parent.find(ATOM + name)
    return (node.text or "").strip() if node is not None else ""


def fetch() -> list[dict[str, str]]:
    request = urllib.request.Request(
        FEED_URL,
        headers={"User-Agent": "AtlasTributarioNewsRadar/1.0 (+official-feed-metadata)"},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = response.read(2_000_000)
    root = ET.fromstring(payload)
    entries = root.findall(ATOM + "entry")
    items = []
    for entry in entries[:30]:
        title = text_of(entry, "title")
        published = text_of(entry, "published") or text_of(entry, "updated")
        link_node = entry.find(ATOM + "link")
        href = link_node.attrib.get("href", "") if link_node is not None else ""
        url = urljoin(FEED_URL, href)
        if not title or not url.startswith("https://www.gov.br/"):
            continue
        items.append({
            "title": title,
            "date": published[:10] if published else "",
            "url": url,
            "source": "Receita Federal",
        })
    if not items:
        raise RuntimeError("O feed oficial foi lido, mas não trouxe publicações válidas.")
    return items


def main() -> None:
    items = fetch()
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": items[:20],
    }
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
    if current != serialized:
        OUTPUT.write_text(serialized, encoding="utf-8")
        print(f"Radar atualizado: {len(payload['items'])} publicações.")
    else:
        print("Radar sem novas publicações; arquivo preservado.")


if __name__ == "__main__":
    main()

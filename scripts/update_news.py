#!/usr/bin/env python3
"""Update noticias.json with publication metadata from the Receita Federal feed.

The Receita site resets connections coming from GitHub Actions, so the main source
is the Prumo assistant server on Render (/api/noticias), which reads the same public
feed. The feed itself is the fallback. It accepts Atom, RSS 1.0 (RDF) and RSS 2.0.
If no source works, the current noticias.json is kept and the script exits with an
error so the workflow shows it.
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "noticias.json"
NEWS_API = "https://atlas-tributario-assistente.onrender.com/api/noticias"
FEED_URL = "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/ultimas-noticias/RSS"
USER_AGENT = "AtlasTributarioNewsRadar/1.2 (+official-feed-metadata)"
MAX_ITEMS = 20


def local(tag: str) -> str:
    """Tag name without namespace: '{ns}item' -> 'item'."""
    return tag.rsplit("}", 1)[-1]


def child_text(node: ET.Element, *names: str) -> str:
    for child in node:
        if local(child.tag) in names and (child.text or "").strip():
            return child.text.strip()
    return ""


def normalize_date(raw: str) -> str:
    raw = raw.strip()
    if not raw:
        return ""
    if raw[:4].isdigit() and len(raw) >= 10 and raw[4] == "-":  # ISO 8601 (Atom, dc:date)
        return raw[:10]
    try:  # RFC 822 (RSS 2.0 pubDate)
        return parsedate_to_datetime(raw).date().isoformat()
    except (TypeError, ValueError):
        return ""


def link_of(node: ET.Element) -> str:
    for child in node:
        if local(child.tag) == "link":
            href = child.attrib.get("href") or (child.text or "").strip()
            if href and child.attrib.get("rel", "alternate") == "alternate":
                return href
    return node.attrib.get("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about", "")


def parse(payload: bytes) -> list[dict[str, str]]:
    root = ET.fromstring(payload)
    entries = [n for n in root.iter() if local(n.tag) in ("item", "entry")]
    items = []
    for entry in entries[:30]:
        title = child_text(entry, "title")
        date = normalize_date(child_text(entry, "published", "updated", "date", "pubDate"))
        url = urljoin(FEED_URL, link_of(entry))
        if not title or not url.startswith("https://www.gov.br/"):
            continue
        items.append({"title": title, "date": date, "url": url, "source": "Receita Federal"})
    items.sort(key=lambda i: i["date"], reverse=True)
    return items


def download(url: str, timeout: int) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read(2_000_000)


def from_api() -> list[dict[str, str]]:
    # The free Render instance sleeps; the first request can take up to a minute.
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            data = json.loads(download(NEWS_API, timeout=90))
            items = [
                {"title": str(i["title"]), "date": str(i.get("date", "")), "url": str(i["url"]),
                 "source": "Receita Federal"}
                for i in data.get("items", [])
                if i.get("title") and str(i.get("url", "")).startswith("https://www.gov.br/")
            ]
            if items:
                return items
            last_error = RuntimeError("o servidor do assistente não trouxe publicações válidas")
        except Exception as exc:
            last_error = exc
        time.sleep(10 * (attempt + 1))
    raise RuntimeError(f"servidor do assistente: {last_error}")


def from_feed() -> list[dict[str, str]]:
    items = parse(download(FEED_URL, timeout=25))
    if not items:
        raise RuntimeError("o feed oficial foi lido, mas não trouxe publicações válidas")
    return items


def fetch() -> list[dict[str, str]]:
    errors = []
    for source in (from_api, from_feed):
        try:
            items = source()
            print(f"Fonte usada: {source.__name__}")
            return items
        except Exception as exc:
            errors.append(str(exc))
            print(f"Aviso: {exc}", file=sys.stderr)
    raise RuntimeError(" | ".join(errors))


def main() -> None:
    try:
        items = fetch()
    except Exception as exc:  # keep the current file; make the failure visible
        print(f"Falha ao atualizar o radar: {exc}. noticias.json mantido.", file=sys.stderr)
        sys.exit(1)
    current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
    try:
        previous_items = json.loads(current).get("items", []) if current else []
    except json.JSONDecodeError:
        previous_items = []
    if items[:MAX_ITEMS] == previous_items:
        print("Radar sem novas publicações; arquivo preservado.")
        return
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": items[:MAX_ITEMS],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Radar atualizado: {len(payload['items'])} publicações.")


if __name__ == "__main__":
    main()

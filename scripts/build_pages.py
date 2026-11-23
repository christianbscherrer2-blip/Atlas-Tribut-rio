#!/usr/bin/env python3
"""Aplica o layout comum (cabeçalho, rodapé, tema e dados estruturados) a todas as páginas.

O menu e o rodapé ficam em um lugar só: scripts/templates/header.html e footer.html.
Edite o modelo e rode:   python3 scripts/build_pages.py
Para só verificar (usado na verificação automática):   python3 scripts/build_pages.py --check

O que o script faz em cada página:
  * troca o <header class="top"> e o <footer class="siteFooter"> pelos modelos;
  * marca com aria-current="page" o item de menu da página atual;
  * remove o link "Pular para o conteúdo" duplicado (o do cabeçalho já existe);
  * coloca no <head> o script que aplica o tema escolhido antes de a página aparecer;
  * grava a data de revisão (do selo "Última atualização") como dateModified no JSON-LD.
O resultado continua sendo HTML estático: o Render serve os arquivos como estão.
"""
from __future__ import annotations

import hashlib
import html as htmlmod
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "scripts" / "templates"
ORIGIN = "https://prumo-empresas.onrender.com"
SKIP = {"googleb49ad066d7bdc0dd.html"}

THEME_SCRIPT = ('<script data-prumo="tema">try{var t=localStorage.getItem("prumo-tema");'
                'if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>')
THEME_COLOR = '<meta name="theme-color" content="#0c1a33">'

HEADER_RE = re.compile(r'<header class="top">.*?</header>', re.S)
FOOTER_RE = re.compile(r'<footer class="siteFooter">.*?</footer>', re.S)
SKIPLINK_RE = re.compile(r'<a class="skipLink" href="#conteudo">Pular para o conteúdo</a>')
THEME_RE = re.compile(r'<script data-prumo="tema">.*?</script>', re.S)
THEME_COLOR_RE = re.compile(r'<meta name="theme-color" content="[^"]*">')
PAGE_LD_RE = re.compile(r'<script type="application/ld\+json" data-prumo="pagina">.*?</script>', re.S)
STAMP_RE = re.compile(r'class="reviewStamp".*?(\d{2})/(\d{2})/(\d{4})', re.S)
RESUMO_RE = re.compile(r'<div class="callout quick30" data-prumo="resumo">.*?</div>', re.S)
RESUMOS = {k: v for k, v in json.loads((ROOT / "scripts" / "resumos.json").read_text(encoding="utf-8")).items()
           if not k.startswith("_")}
ASSETS = ["site.css", "site.js", "assistente.js", "jornada.js", "mudancas.js", "acrescimos.js", "painel.js"]
ASSET_DIGESTS = {
    name: hashlib.sha256((ROOT / name).read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:10]
    for name in ASSETS if (ROOT / name).exists()
}


def pages() -> list[Path]:
    files = sorted(list(ROOT.glob("*.html")) + list(ROOT.glob("artigos/*.html")))
    return [f for f in files if f.name not in SKIP]


def url_path(page: Path) -> str:
    rel = page.relative_to(ROOT).as_posix()
    return "/" if rel == "index.html" else "/" + rel


def header_for(page: Path, template: str) -> str:
    path = url_path(page)
    # Artigos individuais ficam sob "Artigos e guias" no menu
    current = "/artigos.html" if path.startswith("/artigos/") else path
    html = template.replace(' aria-current="page"', "")
    before, sep, nav = html.partition('<nav class="siteNav"')  # só os links do menu, nunca o logotipo
    return before + sep + nav.replace(f'href="{current}"', f'href="{current}" aria-current="page"', 1)


def page_ld(html: str, page: Path) -> str | None:
    stamp = STAMP_RE.search(html)
    if not stamp:
        return None
    day, month, year = stamp.groups()
    iso = f"{year}-{month}-{day}"
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    canonical = re.search(r'rel="canonical" href="([^"]+)"', html)
    data = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": (title.group(1).strip() if title else page.stem),
        "url": canonical.group(1) if canonical else ORIGIN + url_path(page),
        "inLanguage": "pt-BR",
        "dateModified": iso,
        "isPartOf": {"@type": "WebSite", "name": "Prumo", "url": ORIGIN + "/"},
        "publisher": {"@type": "Organization", "name": "Prumo"},
    }
    return ('<script type="application/ld+json" data-prumo="pagina">'
            + json.dumps(data, ensure_ascii=False) + "</script>")


def sync_article_date(html: str) -> str:
    """Nos artigos, o JSON-LD Article já tem dateModified: mantém igual ao selo de revisão."""
    stamp = STAMP_RE.search(html)
    if not stamp:
        return html
    day, month, year = stamp.groups()
    return re.sub(r'("@type": ?"Article".*?"dateModified": ?")\d{4}-\d{2}-\d{2}"',
                  lambda m: m.group(1) + f'{year}-{month}-{day}"', html, count=1, flags=re.S)


def build(page: Path, header_tpl: str, footer_tpl: str) -> tuple[str, list[str]]:
    original = page.read_text(encoding="utf-8")
    html = original
    problems: list[str] = []

    if HEADER_RE.search(html):
        html = HEADER_RE.sub(lambda _: header_for(page, header_tpl), html, count=1)
    else:
        problems.append("sem <header class=\"top\">")
    if FOOTER_RE.search(html):
        html = FOOTER_RE.sub(lambda _: footer_tpl, html, count=1)
    else:
        problems.append("sem <footer class=\"siteFooter\">")
    html = SKIPLINK_RE.sub("", html)

    html = THEME_RE.sub("", html)
    html = THEME_COLOR_RE.sub("", html)
    viewport = re.search(r'<meta name="viewport"[^>]*>', html)
    if viewport:
        html = html[:viewport.end()] + THEME_COLOR + THEME_SCRIPT + html[viewport.end():]
    else:
        problems.append("sem meta viewport")

    # Endereço do CSS/JS com a impressão digital do conteúdo: navegador baixa de novo só quando muda
    for asset, digest in ASSET_DIGESTS.items():
        html = re.sub(rf'(["\']/{re.escape(asset)})(\?v=[0-9a-f]+)?(["\'])', rf'\1?v={digest}\3', html)

    # Bloco "Em 30 segundos" (texto em scripts/resumos.json), logo depois dos avisos do topo
    html = RESUMO_RE.sub("", html)
    resumo = RESUMOS.get(page.relative_to(ROOT).as_posix())
    if resumo:
        inicio = re.search(r'<main id="conteudo"[^>]*>(?:\s*<div class="alert"[^>]*>.*?</div>)*', html, re.S)
        if inicio:
            bloco = ('<div class="callout quick30" data-prumo="resumo"><strong>Em 30 segundos:</strong> '
                     + htmlmod.escape(resumo, quote=False) + '</div>')
            html = html[:inicio.end()] + bloco + html[inicio.end():]
        else:
            problems.append("sem <main id=\"conteudo\"> para o resumo")

    html = PAGE_LD_RE.sub("", html)
    if '"@type": "Article"' in html or '"@type":"Article"' in html:
        html = sync_article_date(html)
    else:
        ld = page_ld(html, page)
        if ld:
            html = html.replace("</head>", ld + "</head>", 1)
    return html, problems


def main() -> int:
    check = "--check" in sys.argv
    header_tpl = (TEMPLATES / "header.html").read_text(encoding="utf-8").strip()
    footer_tpl = (TEMPLATES / "footer.html").read_text(encoding="utf-8").strip()
    changed, errors = [], []
    for page in pages():
        html, problems = build(page, header_tpl, footer_tpl)
        rel = page.relative_to(ROOT).as_posix()
        errors += [f"{rel}: {p}" for p in problems]
        if html != page.read_text(encoding="utf-8"):
            changed.append(rel)
            if not check:
                page.write_text(html, encoding="utf-8", newline="\n")
    for e in errors:
        print("ERRO:", e)
    if check:
        for c in changed:
            print("FORA DO PADRÃO:", c, "(rode python3 scripts/build_pages.py)")
        print(f"{len(pages())} páginas | {len(changed)} fora do padrão | {len(errors)} erro(s)")
        return 1 if changed or errors else 0
    print(f"{len(pages())} páginas | {len(changed)} atualizada(s) | {len(errors)} erro(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

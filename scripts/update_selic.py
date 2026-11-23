#!/usr/bin/env python3
"""Atualiza selic.json com a taxa Selic acumulada em cada mês (Banco Central, série SGS 4390).

A calculadora de acréscimos (acrescimos.html) usa estes valores para os juros de mora de
débitos federais pagos em atraso (Lei 9.430/1996, art. 61, §3º, e art. 5º, §3º).

Fonte principal: API do Banco Central. Reserva: o servidor do assistente no Render
(/api/selic), que lê a mesma série. Só entram meses já encerrados; o mês corrente
é parcial e fica fora. Se nenhuma fonte responder, o arquivo atual é mantido e o
script sai com erro, para o robô mostrar a falha.
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "selic.json"
BCB = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=01/01/2010"
RENDER = "https://atlas-tributario-assistente.onrender.com/api/selic"
USER_AGENT = "PrumoSelic/1.0 (+serie-oficial-bcb)"


def baixar(url: str, timeout: int) -> list:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read(2_000_000))
    return data["meses"] if isinstance(data, dict) else data


def normalizar(linhas: list) -> dict[str, float]:
    """[{'data': '01/10/2026', 'valor': '1.07'}] ou {'2026-10': 1.07} -> {'2026-10': 1.07}, só meses encerrados."""
    hoje = date.today()
    atual = f"{hoje.year:04d}-{hoje.month:02d}"
    meses: dict[str, float] = {}
    for item in linhas:
        if isinstance(item, dict) and "data" in item:
            d, m, a = item["data"].split("/")
            chave, valor = f"{a}-{m}", float(item["valor"])
        else:
            chave, valor = item[0], float(item[1])
        if chave < atual:
            meses[chave] = round(valor, 4)
    if len(meses) < 12:
        raise RuntimeError(f"série curta demais ({len(meses)} meses)")
    return dict(sorted(meses.items()))


def obter() -> tuple[dict[str, float], str]:
    erros = []
    for nome, url, timeout in (("Banco Central", BCB, 40), ("servidor do assistente", RENDER, 90)):
        for tentativa in range(2):
            try:
                return normalizar(baixar(url, timeout)), nome
            except Exception as exc:
                erros.append(f"{nome}: {exc}")
                time.sleep(10)
    raise RuntimeError(" | ".join(erros))


def main() -> None:
    try:
        meses, fonte = obter()
    except Exception as exc:
        print(f"Falha ao atualizar a Selic: {exc}. selic.json mantido.", file=sys.stderr)
        sys.exit(1)
    atual = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    if atual.get("meses") == meses:
        print(f"Selic sem mudança ({len(meses)} meses).")
        return
    payload = {
        "fonte": "Banco Central do Brasil, série SGS 4390 (Selic acumulada no mês, % a.m.)",
        "obtido_via": fonte,
        "atualizado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "ultimo_mes": list(meses)[-1],
        "meses": meses,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Selic atualizada até {payload['ultimo_mes']} ({len(meses)} meses), via {fonte}.")


if __name__ == "__main__":
    main()

"""Fundos "vazios" dos quatro mundos, para a aba Mundo do app.

O app desenha o céu (CSS) e, por cima destes fundos, os itens que a pessoa ganhou:
cada música planta uma árvore, traz um peixe, um bicho ou acende uma estrela.
Por isso aqui só vai a paisagem (morros, mar, lago, horizonte), sem os itens colecionáveis.

Saída: public/mundos/base/{mundo}-{dia|noite}.svg  (1080 x 1500, fundo transparente no alto)
Uso:   python3 tools/mundos_base.py
"""
import math, os, sys

sys.path.insert(0, os.path.dirname(__file__))
from mundos import (S, morros, arvore_pilula, capim, flores, mix, ceu_em, vagalume,  # noqa: E402
                    V600, V700, V800, V900, VERDE, AZUL, NOITE, LUA, BRANCO, LARANJA, ROSA, ROXO, MALVA)

W, H = 1080, 1500
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "mundos", "base")


def tinta(modo):
    dia = modo == "dia"
    if dia:
        return lambda c, f, t: mix(c, ceu_em(f, modo), t)
    return lambda c, f, t: mix(mix(c, AZUL, 0.35), NOITE, t)


def floresta(modo):
    s = S(W, H, 7, modo)
    u, dia, t = s.u, modo == "dia", tinta(modo)
    tronco = "#5B3A29" if dia else "#2A1E1C"
    morros(s, H * .52, 7 * u, 6, t(V900, .46, .62 if dia else .55), seed=1)
    w, gap, x, i = 2.3 * u, 1.05 * u, -2.3 * u, 0
    while x < W + w:  # fileira-equalizador ao fundo (paisagem, não é item)
        f = 0.5 + 0.30 * math.sin(i * 0.52 + 0.8) + 0.16 * math.sin(i * 1.37) + 0.06 * math.sin(i * 2.9)
        arvore_pilula(s, x, H * .58, w, (5 + 10 * f) * u, t(V700, .5, .55 if dia else .5), t(tronco, .58, .5), luz=0.06)
        x += w + gap
        i += 1
    s.faixa(H * .50, H * .62, ceu_em(.5, modo) if dia else "#1B2450", .55 if dia else .5)
    morros(s, H * .64, 4.5 * u, 8, t(V900, .64, .38), seed=2)
    chao = mix(V900, MALVA, .25) if dia else mix(V900, NOITE, .55)
    morros(s, H * .72, 2.6 * u, 10, chao, seed=3)
    s.rect(0, H * .78, W, H * .22, chao, rx=0)
    capim(s, H * .74, H * 1.0, int(W / u * .9), [V600, V700, VERDE] if dia else [V800, V700], 1.0, 2.6, .8)
    flores(s, H * .9, H * .995, int(W / u / 10), ["#FFC93A", BRANCO, LARANJA])
    if not dia:
        for _ in range(14):
            vagalume(s, s.r.uniform(0, W), s.r.uniform(H * .5, H * .95), s.r.uniform(.6, 1))
    return s.svg()


def oceano(modo):
    s = S(W, H, 3, modo)
    u, dia, r = s.u, modo == "dia", s.r
    hz = H * .20
    mar = [(0, mix("#5B7F8A", ROSA, .35)), (.35, "#2F5A6E"), (.75, "#163A55"), (1, AZUL)] if dia else [(0, "#13305A"), (.4, AZUL), (1, "#060E1E")]
    s.add(f'<rect x="0" y="{hz:.1f}" width="{W}" height="{H - hz:.1f}" fill="{s.vertical(mar)}"/>')
    for _ in range(int(W / u / 6)):
        s.pill(r.uniform(0, W), hz + r.uniform(0.6, 2.8) * u, r.uniform(3, 9) * u, 0.45 * u, BRANCO, .35 if dia else .18, rot=90)
    s.rect(0, hz - 0.35 * u, W, 0.7 * u, mix(ROSA, BRANCO, .35) if dia else "#2A4A7A", rx=0)
    for k in range(6):
        x = W * (0.04 + k * 0.18)
        s.path(f"M{x:.1f} {hz:.1f} L{x + 5 * u:.1f} {hz:.1f} L{x + 22 * u:.1f} {H} L{x + 9 * u:.1f} {H} Z", BRANCO, .06 if dia else .025)
    areia = mix(LUA, MALVA, .14) if dia else "#2B2A33"
    fundo = H * .90
    morros(s, fundo, 3.2 * u, 7, areia, seed=5)
    x = r.uniform(0, 4) * u
    while x < W:
        h = r.uniform(10, 24) * u
        cor = mix(V700, AZUL, .25) if dia else mix(V800, NOITE, .3)
        s.pill(x, fundo + 3 * u, 1.5 * u, h, cor, .9)
        s.pill(x + 1.8 * u, fundo + 3 * u, 1.2 * u, h * 0.7, cor, .75)
        x += r.uniform(12, 20) * u
    for _ in range(int(W / u / 3)):
        x, y = r.uniform(0, W), r.uniform(hz + 3 * u, H * .95)
        s.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r.uniform(.3, .85) * u:.1f}" fill="none" stroke="{BRANCO}" stroke-width="{.18 * u:.2f}" opacity=".45"/>')
    return s.svg()


def animais(modo):
    s = S(W, H, 11, modo)
    u, dia, t, r = s.u, modo == "dia", tinta(modo), s.r
    tronco = "#5B3A29" if dia else "#2A1E1C"
    morros(s, H * .52, 7 * u, 5, t(V900, .47, .6 if dia else .55), seed=8)
    w, gap, x, i = 2.3 * u, 1.05 * u, -2.3 * u, 0
    while x < W + w:
        f = 0.5 + 0.30 * math.sin(i * 0.45 + 2) + 0.15 * math.sin(i * 1.3)
        if r.random() < 0.7:
            arvore_pilula(s, x, H * .57, w, (4 + 9 * f) * u, t(V700, .5, .55 if dia else .5), t(tronco, .57, .5), luz=.06)
        x += w + gap
        i += 1
    s.faixa(H * .50, H * .61, ceu_em(.5, modo) if dia else "#1B2450", .5)
    campo = mix(V800, MALVA, .3) if dia else mix(V900, NOITE, .5)
    morros(s, H * .64, 4 * u, 6, t(V900, .64, .3), seed=9)
    morros(s, H * .71, 2 * u, 9, campo, seed=10)
    s.rect(0, H * .76, W, H * .24, campo, rx=0)
    lx, ly = W * .62, H * .80
    s.ellipse(lx, ly, 26 * u, 4.2 * u, ceu_em(.25, modo) if dia else "#1A2550")
    s.ellipse(lx - 3 * u, ly - 0.8 * u, 12 * u, 0.5 * u, BRANCO, .35)
    capim(s, H * .78, H, int(W / u * .8), [V600, V700, VERDE] if dia else [V800, V700], 1.0, 2.8, .8)
    flores(s, H * .9, H * .995, int(W / u / 10), ["#FFC93A", BRANCO, LARANJA])
    return s.svg()


def universo(modo):
    s = S(W, H, 5, modo)
    u, dia, r = s.u, modo == "dia", s.r
    if dia:
        for _ in range(40):
            s.circle(r.uniform(0, W), r.uniform(0, H * .7), r.choice([.14, .2, .26]) * u, BRANCO, r.uniform(.2, .5))
    R = W * 1.6
    cyh = H * .97 + R - 8 * u
    s.circle(W / 2, cyh, R + 2.6 * u, LARANJA, .18)
    s.circle(W / 2, cyh, R + 1.0 * u, LARANJA, .35)
    s.circle(W / 2, cyh, R, "#1A1033" if not dia else mix(MALVA, ROXO, .45))
    for _ in range(26):  # crateras e pedrinhas no chão do planeta
        x = r.uniform(0, W)
        y = cyh - math.sqrt(max(0, R * R - (x - W / 2) ** 2)) + r.uniform(2, 9) * u
        s.ellipse(x, y, r.uniform(.8, 2.4) * u, r.uniform(.25, .6) * u, BRANCO, .06)
    return s.svg()


MUNDOS = {"floresta": floresta, "oceano": oceano, "animais": animais, "universo": universo}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for nome, fn in MUNDOS.items():
        for modo in ("dia", "noite"):
            svg = fn(modo)
            with open(os.path.join(OUT, f"{nome}-{modo}.svg"), "w") as f:
                f.write(svg)
            print(nome, modo, len(svg))

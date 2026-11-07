"""Ilustrações dos mundos da Primeira Melodia — Floresta, Oceano, Animais e Universo.

Linguagem visual tirada do logo e do app:
  · só círculos, pílulas (as barras do equalizador) e morros suaves; nada de contorno;
  · o céu do app: dia dourado que desce para o roxo, noite azul-marinho com planetas, lua em anel e estrelas;
  · cores exatas do app: laranja #FF8A00, verde #22C55E / #86EFAC, sol #FFC93A, noite #0D0B24...

Saídas (pasta ilustracoes/):
  mundos/{mundo}-{dia|noite}-{paisagem|retrato}.svg/.png   cena completa (1600x900 e 1080x1920)
  camadas/{mundo}-{dia|noite}-camada.png                   só o chão, fundo transparente, para pôr sobre o céu do app
  elementos/{mundo}/*.svg                                  peças soltas (uma árvore, um peixe...) para o app desenhar uma por música
"""
import math, os, random, sys

# ------------------------------------------------------------------ paleta do app
LARANJA, VERDE, VERDE_CLARO, SOL, BRANCO, VERMELHO = "#FF8A00", "#22C55E", "#86EFAC", "#FFC93A", "#FAFAFA", "#EF4444"
ROSA = "#E5999F"   # Rosa Amanhecer (marca v4)
NOITE, ROXO, AZUL, LUA, LUA_MIOLO, BASE = "#0D0B24", "#33163C", "#0C2038", "#B3AB90", "#5C5457", "#09090B"
V600, V700, V800, V900 = "#16A34A", "#15803D", "#166534", "#14532D"   # verdes da mesma família do #22C55E
# céu do dia (marca v4): amanhecer rosa, do pêssego ao malva
CEU_DIA = [(0, "#F7C2AB"), (.18, "#F3B6AA"), (.34, "#EBA5A4"), (.48, "#DE919C"), (.60, "#D08497"),
           (.72, "#BC708D"), (.84, "#A35D7E"), (.93, "#8D5073"), (1, "#7D496E")]
MALVA = "#7D496E"  # base do céu do dia


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def hexa(c):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v))) for v in c)


def mix(a, b, t):
    A, B = rgb(a), rgb(b)
    return hexa([A[i] + (B[i] - A[i]) * t for i in range(3)])


def ceu_em(f, modo):
    """Cor do céu na altura f (0 = topo, 1 = base)."""
    if modo == "noite":
        return NOITE
    f = max(0, min(1, f))
    for (o0, c0), (o1, c1) in zip(CEU_DIA, CEU_DIA[1:]):
        if f <= o1:
            return mix(c0, c1, (f - o0) / (o1 - o0))
    return CEU_DIA[-1][1]


def f1(v):
    return f"{v:.1f}"


# ------------------------------------------------------------------ construtor de SVG
class S:
    def __init__(self, W, H, seed, modo="dia"):
        self.W, self.H, self.modo = W, H, modo
        self.u = min(W, H) / 100
        self.r = random.Random(seed)
        self.defs, self.out, self._n, self._grad = [], [], 0, {}

    def add(self, s):
        self.out.append(s)

    @staticmethod
    def op(o):
        return "" if o >= 1 else f' opacity="{o:.2f}"'

    def rect(self, x, y, w, h, fill, rx=None, o=1, extra=""):
        rx = min(w, h) / 2 if rx is None else rx
        self.add(f'<rect x="{f1(x)}" y="{f1(y)}" width="{f1(w)}" height="{f1(h)}" rx="{f1(rx)}" fill="{fill}"{self.op(o)}{extra}/>')

    def pill(self, cx, base, w, h, fill, o=1, rot=0):
        extra = f' transform="rotate({rot:.1f} {f1(cx)} {f1(base)})"' if rot else ""
        self.rect(cx - w / 2, base - h, w, h, fill, o=o, extra=extra)

    def circle(self, cx, cy, r, fill, o=1):
        self.add(f'<circle cx="{f1(cx)}" cy="{f1(cy)}" r="{f1(r)}" fill="{fill}"{self.op(o)}/>')

    def ellipse(self, cx, cy, rx, ry, fill, o=1, rot=0):
        extra = f' transform="rotate({rot:.1f} {f1(cx)} {f1(cy)})"' if rot else ""
        self.add(f'<ellipse cx="{f1(cx)}" cy="{f1(cy)}" rx="{f1(rx)}" ry="{f1(ry)}" fill="{fill}"{self.op(o)}{extra}/>')

    def path(self, d, fill, o=1, extra=""):
        self.add(f'<path d="{d}" fill="{fill}"{self.op(o)}{extra}/>')

    def glow(self, color, o=0.5):
        """Gradiente radial do centro (opaco) para a borda (transparente). Reaproveitado por cor/opacidade."""
        k = (color, round(o, 2))
        if k not in self._grad:
            self._n += 1
            gid = f"gl{self._n}"
            self.defs.append(f'<radialGradient id="{gid}"><stop offset="0" stop-color="{color}" stop-opacity="{o:.2f}"/>'
                             f'<stop offset=".45" stop-color="{color}" stop-opacity="{o * .35:.2f}"/>'
                             f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>')
            self._grad[k] = gid
        return f"url(#{self._grad[k]})"

    def faixa(self, y0, y1, color, o):
        """Névoa: faixa horizontal que some nas bordas de cima e de baixo."""
        self._n += 1
        gid = f"nv{self._n}"
        self.defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
                         f'<stop offset="0" stop-color="{color}" stop-opacity="0"/>'
                         f'<stop offset=".55" stop-color="{color}" stop-opacity="{o:.2f}"/>'
                         f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient>')
        self.add(f'<rect x="0" y="{f1(y0)}" width="{self.W}" height="{f1(y1 - y0)}" fill="url(#{gid})"/>')

    def vertical(self, stops):
        self._n += 1
        gid = f"vg{self._n}"
        st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
        self.defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">{st}</linearGradient>')
        return f"url(#{gid})"

    def svg(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.W} {self.H}" width="{self.W}" height="{self.H}">'
                f'<defs>{"".join(self.defs)}</defs>{"".join(self.out)}</svg>')


# ------------------------------------------------------------------ céu (igual ao app)
def ceu(s, sol=True, nuvens=True, planetas=True, estrelas=True, lua=True):
    W, H, u, r = s.W, s.H, s.u, s.r
    retrato = H > W
    if s.modo == "dia":
        s.add(f'<rect width="{W}" height="{H}" fill="{s.vertical(CEU_DIA)}"/>')
        if planetas:  # os discos claros que o app mostra de dia
            s.circle(W * (0.80 if not retrato else 0.78), H * (0.20 if not retrato else 0.17), (17 if not retrato else 22) * u, LUA, 0.30)
            s.circle(W * -0.02, H * (0.52 if not retrato else 0.40), (20 if not retrato else 26) * u, "#7A5A72", 0.28)
        if sol:
            sx, sy, sr = W * 0.12, H * (0.17 if not retrato else 0.10), 5.2 * u
            s.circle(sx, sy, sr * 3.4, s.glow(SOL, 0.55))
            for k in range(8):
                a = k * math.pi / 4
                cx, cy = sx + math.cos(a) * sr * 1.62, sy + math.sin(a) * sr * 1.62
                s.rect(cx - 0.55 * u, cy - 1.35 * u, 1.1 * u, 2.7 * u, SOL,
                       extra=f' transform="rotate({math.degrees(a) + 90:.1f} {f1(cx)} {f1(cy)})"')
            s.circle(sx, sy, sr, SOL)
        if nuvens:
            spots = [(0.56, 0.12, 1.0), (0.90, 0.30, 0.8), (0.30, 0.33, 0.62)] if not retrato else \
                    [(0.62, 0.07, 1.0), (0.86, 0.25, 0.8), (0.22, 0.31, 0.7)]
            for fx, fy, k in spots:
                nuvem(s, W * fx, H * fy, k)
    else:
        s.add(f'<rect width="{W}" height="{H}" fill="{NOITE}"/>')
        if planetas:
            s.circle(W * 0.08, H * (0.16 if not retrato else 0.12), (40 if not retrato else 52) * u, ROXO)
            s.circle(W * (0.97 if not retrato else 1.02), H * (0.52 if not retrato else 0.44), (26 if not retrato else 34) * u, AZUL)
        if estrelas:
            n = int(W * H / 5200)
            for _ in range(n):
                s.circle(r.uniform(0, W), r.uniform(0, H * 0.9), r.choice([0.12, 0.16, 0.2, 0.26]) * u, BRANCO, r.uniform(0.3, 0.85))
            for _ in range(7):
                brilho(s, r.uniform(W * 0.05, W * 0.95), r.uniform(H * 0.04, H * 0.45), r.uniform(0.7, 1.2) * u, BRANCO, 0.85)
        if lua:
            mx, my, mr = W * 0.83, H * (0.17 if not retrato else 0.11), 5.2 * u
            s.circle(mx, my, mr * 3.2, s.glow(LUA, 0.22))
            s.add(f'<circle cx="{f1(mx)}" cy="{f1(my)}" r="{f1(mr)}" fill="{LUA_MIOLO}" stroke="{LUA}" stroke-width="{f1(1.15 * u)}"/>')


def nuvem(s, x, y, k):
    u = s.u * k
    c = "#E2D3C3"
    s.rect(x - 9 * u, y - 2.6 * u, 18 * u, 5.2 * u, c, o=0.34)
    for dx, dy, rr in [(-4.2, -2.2, 3.3), (0.6, -3.6, 4.4), (5, -1.8, 3)]:
        s.circle(x + dx * u, y + dy * u, rr * u, c, 0.34)


def brilho(s, x, y, k, cor, o=1):
    """Estrela de 4 pontas (o brilho do app)."""
    a, b = k, k * 0.16
    d = (f"M{f1(x)} {f1(y - a)} C{f1(x + b)} {f1(y - b)} {f1(x + b)} {f1(y - b)} {f1(x + a)} {f1(y)} "
         f"C{f1(x + b)} {f1(y + b)} {f1(x + b)} {f1(y + b)} {f1(x)} {f1(y + a)} "
         f"C{f1(x - b)} {f1(y + b)} {f1(x - b)} {f1(y + b)} {f1(x - a)} {f1(y)} "
         f"C{f1(x - b)} {f1(y - b)} {f1(x - b)} {f1(y - b)} {f1(x)} {f1(y - a)} Z")
    s.path(d, cor, o)


def morros(s, base, amp, n, cor, o=1, seed=None):
    W, H = s.W, s.H
    rr = random.Random(seed) if seed is not None else s.r
    step = (W + 80) / n
    pts = [(-40 + i * step, base - amp * (0.35 + 0.65 * rr.random())) for i in range(n + 1)]
    d = f"M-40 {H + 40} L{f1(pts[0][0])} {f1(pts[0][1])} "
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        mx = (x0 + x1) / 2
        d += f"C{f1(mx)} {f1(y0)} {f1(mx)} {f1(y1)} {f1(x1)} {f1(y1)} "
    d += f"L{W + 40} {H + 40} Z"
    s.path(d, cor, o)


# ------------------------------------------------------------------ elementos da floresta
def arvore_pilula(s, x, base, w, h, copa, tronco, luz=0.16):
    """A árvore-barra: a mesma pílula das barras do logo, sobre um tronco fino."""
    u = s.u
    tw = max(0.42 * u, w * 0.16)
    th = h * 0.20
    s.rect(x - tw / 2, base - th - w * 0.3, tw, th + w * 0.3, tronco, rx=tw / 2)
    ch = h - th
    s.rect(x - w / 2, base - h, w, ch, copa)
    if luz:
        s.rect(x - w / 2 + w * 0.17, base - h + w * 0.2, w * 0.26, ch * 0.55, "#FFFFFF", o=luz)


def arvore_redonda(s, x, base, h, copa, tronco, luz=0.14):
    u = s.u
    rr = h * 0.29
    th = h * 0.46
    tw = max(0.5 * u, rr * 0.2)
    s.rect(x - tw / 2, base - th, tw, th, tronco, rx=tw / 2)
    cy = base - h + rr * 1.02
    for dx, dy, k in [(-0.64, 0.32, 0.70), (0.64, 0.34, 0.68), (0, 0, 1)]:
        s.circle(x + dx * rr, cy + dy * rr, rr * k, copa)
    if luz:
        s.circle(x - rr * 0.36, cy - rr * 0.32, rr * 0.36, "#FFFFFF", luz)


def ipe(s, x, base, h, tronco, flor=SOL, flor2=LARANJA, chao_y=None):
    """Árvore especial: o ipê-amarelo, copa de flores no lugar das folhas."""
    u, r = s.u, s.r
    tw = h * 0.055
    th = h * 0.5
    s.rect(x - tw / 2, base - th, tw, th, tronco, rx=tw / 2)
    # dois galhos
    for ang, L in [(-38, 0.26), (34, 0.24)]:
        s.rect(x - tw * 0.4, base - th - h * L * 0.1, tw * 0.8, h * L, tronco, rx=tw * 0.4,
               extra=f' transform="rotate({ang} {f1(x)} {f1(base - th * 0.82)})"')
    cy = base - h * 0.70
    rr = h * 0.18
    for dx, dy, k in [(-1.35, 0.25, 0.78), (1.35, 0.3, 0.75), (-0.7, -0.45, 0.9), (0.75, -0.42, 0.88), (0, 0.15, 1.05), (0, -0.9, 0.72)]:
        s.circle(x + dx * rr, cy + dy * rr, rr * k, flor)
    for _ in range(18):  # florzinhas laranja
        a, d = r.uniform(0, 2 * math.pi), r.uniform(0.2, 1.7) * rr
        s.circle(x + math.cos(a) * d * 1.15, cy + math.sin(a) * d * 0.7, r.uniform(0.28, 0.5) * u, flor2, 0.9)
    s.circle(x - rr * 0.6, cy - rr * 0.55, rr * 0.4, "#FFFFFF", 0.18)
    if chao_y:  # pétalas no chão
        for _ in range(12):
            s.circle(x + r.uniform(-2.2, 2.2) * rr, chao_y + r.uniform(-0.6, 0.8) * u, r.uniform(0.25, 0.45) * u, flor, 0.85)


BROTO_STEM = (587, 34, 14, 66)
BROTO_FOLHAS = ["M594 44 C 574 20, 540 6, 498 10 C 506 46, 548 62, 594 44 Z",
                "M594 36 C 616 8, 652 -8, 694 -4 C 686 32, 644 52, 594 36 Z"]


def broto(s, x, base, altura, cor=VERDE, cor_folha=None):
    """O broto do logo, exatamente com as mesmas curvas."""
    k = altura / 108
    sx, sy, sw, sh = BROTO_STEM
    g = f'<g transform="translate({f1(x - 594 * k)} {f1(base - 100 * k)}) scale({k:.4f})">'
    g += f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="7" fill="{cor}"/>'
    for d in BROTO_FOLHAS:
        g += f'<path d="{d}" fill="{cor_folha or cor}"/>'
    s.add(g + "</g>")


def nota(s, x, y, k, cor, o=1, rot=0):
    """Colcheia em pílulas e círculos."""
    sc = k * s.u / 10
    s.add(f'<g transform="translate({f1(x)} {f1(y)}) rotate({rot}) scale({sc:.3f})"{S.op(o)}>'
          f'<ellipse cx="0" cy="0" rx="4.2" ry="3.1" transform="rotate(-24)" fill="{cor}"/>'
          f'<rect x="2.5" y="-15" width="1.6" height="15" rx=".8" fill="{cor}"/>'
          f'<path d="M2.6 -15 C 6.4 -13.2, 9.6 -10.8, 8.8 -5.6 C 7.8 -8.4, 5.8 -9.8, 2.6 -10.4 Z" fill="{cor}"/></g>')


def vagalume(s, x, y, k=1):
    u = s.u
    s.circle(x, y, 1.9 * u * k, s.glow(SOL, 0.55))
    s.circle(x, y, 0.3 * u * k, "#FFE58A")


def capim(s, y0, y1, n, cores, hmin=1.2, hmax=3.0, o=0.95):
    u, r = s.u, s.r
    for _ in range(n):
        x = r.uniform(-u, s.W + u)
        s.pill(x, r.uniform(y0, y1), 0.42 * u, r.uniform(hmin, hmax) * u, r.choice(cores), o, rot=r.uniform(-8, 8))


def flores(s, y0, y1, n, cores):
    u, r = s.u, s.r
    for _ in range(n):
        x, y = r.uniform(0, s.W), r.uniform(y0, y1)
        hh = r.uniform(1.2, 2.4) * u
        s.pill(x, y, 0.3 * u, hh, V700)
        c = r.choice(cores)
        for a in range(5):
            t = a * 2 * math.pi / 5
            s.circle(x + math.cos(t) * 0.45 * u, y - hh + math.sin(t) * 0.45 * u, 0.36 * u, c)
        s.circle(x, y - hh, 0.26 * u, LARANJA if c != LARANJA else SOL)


# ------------------------------------------------------------------ FLORESTA
def floresta(W, H, modo, com_ceu=True):
    s = S(W, H, 7, modo)
    u, r = s.u, s.r
    retrato = H > W
    if com_ceu:
        ceu(s)
    dia = modo == "dia"
    # alturas de cada camada (fração da altura)
    L = dict(morro_long=.60, eq=.665, morro_meio=.715, meio=.785, chao=.835, clareira=.865) if not retrato else \
        dict(morro_long=.615, eq=.66, morro_meio=.705, meio=.775, chao=.83, clareira=.86)
    tint = (lambda c, f, t: mix(c, ceu_em(f, modo), t)) if dia else (lambda c, f, t: mix(mix(c, AZUL, 0.35), NOITE, t))
    tronco = "#5B3A29" if dia else "#2A1E1C"

    # 1. morros ao longe
    morros(s, H * L["morro_long"], 7 * u, 6, tint(V900, L["morro_long"] - .06, .62 if dia else .55), seed=1)
    # 2. a fileira-equalizador: árvores-barra iguais em largura, alturas em onda de som
    w, gap = 2.3 * u, 1.05 * u
    x, i = -w, 0
    while x < W + w:
        f = 0.5 + 0.30 * math.sin(i * 0.52 + 0.8) + 0.16 * math.sin(i * 1.37) + 0.06 * math.sin(i * 2.9)
        h = (5.5 + 11 * f) * u
        arvore_pilula(s, x, H * L["eq"], w, h, tint(V700, L["eq"] - .08, .52 if dia else .45), tint(tronco, L["eq"], .5), luz=0.07)
        x += w + gap
        i += 1
    s.faixa(H * (L["eq"] - .07), H * (L["eq"] + .04), ceu_em(L["eq"] - .05, modo) if dia else "#1B2450", 0.55 if dia else 0.5)
    # 3. morro do meio
    morros(s, H * L["morro_meio"], 4.5 * u, 8, tint(V900, L["morro_meio"], .38 if dia else .38), seed=2)
    # 4. árvores do meio (deixa uma clareira no centro para o broto)
    x = -1.5 * u
    cores_meio = [V600, V700, V800, VERDE] if dia else [V700, V800, V600]
    while x < W + 3 * u:
        if abs(x - W / 2) > (11 if not retrato else 13) * u:
            c = tint(r.choice(cores_meio), L["meio"], .18 if dia else .28)
            if r.random() < 0.55:
                arvore_pilula(s, x, H * L["meio"], r.uniform(3.4, 4.6) * u, r.uniform(13, 21) * u, c, tint(tronco, L["meio"], .2), luz=.12)
            else:
                arvore_redonda(s, x, H * L["meio"], r.uniform(14, 19) * u, c, tint(tronco, L["meio"], .2), luz=.1)
        x += r.uniform(4.6, 6.8) * u
    s.faixa(H * (L["meio"] - .05), H * (L["meio"] + .03), ceu_em(L["meio"], modo) if dia else "#141B3D", 0.35 if dia else 0.35)
    # 5. chão da frente e clareira
    chao = mix(V900, "#2E293D", .25) if dia else mix(V900, NOITE, .55)
    morros(s, H * L["chao"], 2.6 * u, 10, chao, seed=3)
    cx, cy = W / 2, H * L["clareira"]
    s.ellipse(cx, cy + 1.5 * u, 19 * u, 4.2 * u, mix(chao, VERDE, .22 if dia else .14))
    # o broto: a primeira melodia plantada
    s.circle(cx, cy - 4 * u, 13 * u, s.glow(SOL, .42 if dia else .5))
    broto(s, cx, cy + 0.6 * u, 10.5 * u, VERDE)
    for dx, dy, k, o in [(5.2, -12.5, 1.0, .95), (9.6, -18.5, .82, .7), (4.4, -23.5, .66, .45)]:
        nota(s, cx + dx * u, cy + dy * u, k, LARANJA, o, rot=8)
    # 6. árvores da frente, emoldurando
    frente = [V600, VERDE, V700] if dia else [V700, V800, V600]
    fr = [(0.035, 30, "r"), (0.125, 22, "p"), (0.88, 24, "p"), (0.965, 31, "r")] if not retrato else \
         [(0.04, 28, "r"), (0.20, 19, "p"), (0.82, 20, "p"), (0.97, 30, "r")]
    for fx, hh, kind in fr:
        c = tint(r.choice(frente), .95, 0 if dia else .12)
        if kind == "r":
            arvore_redonda(s, W * fx, H * 0.995, hh * u, c, tronco, luz=.14 if dia else .07)
        else:
            arvore_pilula(s, W * fx, H * 0.985, 5.2 * u, hh * u, c, tronco, luz=.15 if dia else .07)
    # ipê-amarelo: árvore especial
    ipe(s, W * (0.25 if not retrato else 0.30), H * 0.93, (26 if not retrato else 23) * u, tronco,
        flor=SOL if dia else mix(SOL, NOITE, .15), chao_y=H * 0.935)
    # 7. capim e flores
    capim(s, H * .86, H * 1.0, int(W / u * 1.3), [V600, V700, VERDE] if dia else [V800, V700], 1.2, 3.2)
    flores(s, H * .89, H * .995, int(W / u / 7), [SOL, BRANCO, LARANJA])
    if not dia:
        for _ in range(int(W / u / 3.2)):
            vagalume(s, r.uniform(0, W), r.uniform(H * .5, H * .97), r.uniform(.7, 1.15))
    return s.svg()


# ------------------------------------------------------------------ OCEANO
def peixe(s, x, y, k, cor, vira=False, o=1):
    sc = k * s.u / 10
    f = -1 if vira else 1
    s.add(f'<g transform="translate({f1(x)} {f1(y)}) scale({f * sc:.3f} {sc:.3f})"{S.op(o)}>'
          f'<path d="M14 0 L27 -9 Q24 0 27 9 Z" fill="{cor}"/>'
          f'<ellipse cx="0" cy="0" rx="17" ry="10" fill="{cor}"/>'
          f'<path d="M-3 -9 Q4 -17 10 -8 Z" fill="{cor}"/>'
          f'<rect x="-2" y="-9.5" width="3.4" height="19" rx="1.7" fill="#FFFFFF" opacity=".28"/>'
          f'<circle cx="-9" cy="-2.5" r="2.6" fill="{BASE}"/><circle cx="-9.7" cy="-3.2" r=".9" fill="#FFFFFF"/></g>')


def tartaruga(s, x, y, k, casco, pele, o=1, vira=False):
    sc = k * s.u / 10
    f = -1 if vira else 1
    s.add(f'<g transform="translate({f1(x)} {f1(y)}) scale({f * sc:.3f} {sc:.3f}) rotate(-8)"{S.op(o)}>'
          f'<rect x="-30" y="-14" width="17" height="7" rx="3.5" fill="{pele}" transform="rotate(-28 -14 -10)"/>'
          f'<rect x="-30" y="7" width="15" height="6" rx="3" fill="{pele}" transform="rotate(24 -14 10)"/>'
          f'<rect x="10" y="-15" width="15" height="6.5" rx="3.2" fill="{pele}" transform="rotate(28 10 -10)"/>'
          f'<rect x="10" y="8" width="13" height="6" rx="3" fill="{pele}" transform="rotate(-20 10 10)"/>'
          f'<circle cx="-27" cy="0" r="6" fill="{pele}"/><circle cx="-29.5" cy="-2" r="1.3" fill="{BASE}"/>'
          f'<ellipse cx="0" cy="0" rx="20" ry="14" fill="{casco}"/>'
          f'<circle cx="0" cy="0" r="5" fill="#FFFFFF" opacity=".16"/><circle cx="-10" cy="-3" r="3.4" fill="#FFFFFF" opacity=".14"/>'
          f'<circle cx="10" cy="-3" r="3.4" fill="#FFFFFF" opacity=".14"/><circle cx="-6" cy="8" r="3" fill="#FFFFFF" opacity=".12"/>'
          f'<circle cx="7" cy="8" r="3" fill="#FFFFFF" opacity=".12"/></g>')


def agua_viva(s, x, y, k, cor):
    u = s.u * k
    s.circle(x, y, 6 * u, s.glow(cor, .35))
    s.path(f"M{f1(x - 3.2 * u)} {f1(y)} A {f1(3.2 * u)} {f1(3 * u)} 0 0 1 {f1(x + 3.2 * u)} {f1(y)} Z", cor, .9)
    for i, dx in enumerate([-2.2, -0.75, 0.75, 2.2]):
        s.pill(x + dx * u, y + (4.2 + (i % 2) * 1.4) * u, 0.42 * u, (3.6 + (i % 2) * 1.4) * u, cor, .7)


def coral(s, x, base, k, cor):
    """Coral-equalizador: três a cinco barras arredondadas nascendo do fundo."""
    u, r = s.u * k, s.r
    n = r.randint(3, 5)
    hs = [r.uniform(4, 13) for _ in range(n)]
    for i, h in enumerate(hs):
        s.pill(x + (i - (n - 1) / 2) * 2.3 * u, base, 1.8 * u, h * u, cor)


def oceano(W, H, modo, com_ceu=True):
    s = S(W, H, 3, modo)
    u, r = s.u, s.r
    retrato = H > W
    dia = modo == "dia"
    hz = H * (0.34 if not retrato else 0.30)
    if com_ceu:
        ceu(s, planetas=not dia, nuvens=dia)
    mar = [(0, "#5B7F8A"), (.35, "#2F5A6E"), (.75, "#163A55"), (1, AZUL)] if dia else \
          [(0, "#13305A"), (.4, AZUL), (1, "#060E1E")]
    s.add(f'<rect x="0" y="{f1(hz)}" width="{W}" height="{f1(H - hz)}" fill="{s.vertical(mar)}"/>')
    # ondas da superfície: pílulas claras
    for i in range(int(W / u / 6)):
        x = r.uniform(0, W)
        s.pill(x, hz + r.uniform(0.6, 2.8) * u, r.uniform(3, 9) * u, 0.45 * u, BRANCO, 0.35 if dia else 0.18, rot=90)
    s.rect(0, hz - 0.35 * u, W, 0.7 * u, mix("#5B7F8A", BRANCO, .35) if dia else "#2A4A7A", rx=0)
    # feixes de luz
    for i in range(6):
        x = W * (0.04 + i * 0.18)
        s.path(f"M{f1(x)} {f1(hz)} L{f1(x + 5 * u)} {f1(hz)} L{f1(x + 22 * u)} {f1(H)} L{f1(x + 9 * u)} {f1(H)} Z",
               BRANCO, 0.06 if dia else 0.025)
    # baleia ao longe
    bx, by = W * 0.70, hz + (H - hz) * 0.30
    sc = u / 3.2
    s.add(f'<g transform="translate({f1(bx)} {f1(by)}) scale({sc:.3f})" opacity="{.55 if dia else .7}">'
          f'<path d="M-62 4 C -60 -16, -20 -24, 20 -16 C 44 -12, 56 -4, 64 -10 L 86 -26 L 80 -4 L 90 16 L 64 4 C 50 14, 10 20, -20 18 C -48 16, -63 14, -62 4 Z" fill="#0A1A30"/>'
          f'<rect x="-30" y="10" width="26" height="7" rx="3.5" fill="#0A1A30" transform="rotate(28 -30 10)"/>'
          f'<circle cx="-44" cy="-2" r="2.4" fill="{LUA}"/></g>')
    # fundo
    areia = mix(LUA, "#2E293D", .1) if dia else "#2B2A33"
    fundo = H * (0.88 if not retrato else 0.86)
    morros(s, fundo, 3.2 * u, 7, areia, seed=5)
    # algas
    x = r.uniform(0, 4) * u
    while x < W:
        h = r.uniform(12, 30) * u
        cor = mix(V700, AZUL, .25) if dia else mix(V800, NOITE, .3)
        s.pill(x, fundo + 3 * u, 1.5 * u, h, cor)
        s.pill(x + 1.8 * u, fundo + 3 * u, 1.2 * u, h * 0.7, cor, .85)
        x += r.uniform(7, 13) * u
    # corais-equalizador
    x = r.uniform(1, 5) * u
    while x < W:
        coral(s, x, fundo + r.uniform(3, 6) * u, r.uniform(.8, 1.2), r.choice([LARANJA, SOL, VERMELHO, VERDE_CLARO, LARANJA]))
        x += r.uniform(10, 17) * u
    # tartaruga, peixes, cardume
    tartaruga(s, W * (0.30 if not retrato else 0.36), hz + (H - hz) * 0.42, 2.0 if not retrato else 2.2, "#15803D", "#86C5A0", 1)
    for i in range(6):
        peixe(s, r.uniform(W * .05, W * .95), r.uniform(hz + (H - hz) * .15, fundo - 12 * u), r.uniform(1.3, 2.1),
              r.choice([LARANJA, SOL, LARANJA]), vira=(i % 2 == 0))
    cx0, cy0 = W * 0.68, hz + (H - hz) * 0.55
    for i in range(11):
        peixe(s, cx0 + (i % 4) * 4.6 * u + (i // 4) * 2.2 * u, cy0 + (i // 4) * 3.4 * u + (i % 2) * u, 0.75, SOL, vira=True, o=.9)
    if not dia:
        for fx, fy, k in [(0.12, 0.55, 1.0), (0.52, 0.40, 0.8), (0.88, 0.62, 0.9)]:
            agua_viva(s, W * fx, hz + (H - hz) * fy, k, VERDE_CLARO)
        for _ in range(int(W / u / 2)):
            s.circle(r.uniform(0, W), r.uniform(hz + 2 * u, H), r.uniform(.12, .3) * u, VERDE_CLARO, r.uniform(.3, .8))
    # bolhas
    for _ in range(int(W / u / 2.5)):
        x, y = r.uniform(0, W), r.uniform(hz + 3 * u, H * .95)
        s.add(f'<circle cx="{f1(x)}" cy="{f1(y)}" r="{f1(r.uniform(.3, .85) * u)}" fill="none" stroke="{BRANCO}" stroke-width="{.18 * u:.2f}" opacity=".5"/>')
    return s.svg()


# ------------------------------------------------------------------ ANIMAIS
def capivara(s, x, base, k, cor, o=1, passarinho=True):
    sc = k * s.u / 10
    esc = mix(cor, BASE, .35)
    g = (f'<g transform="translate({f1(x)} {f1(base)}) scale({sc:.3f})"{S.op(o)}>'
         f'<rect x="-30" y="-8" width="9" height="12" rx="4.5" fill="{esc}"/><rect x="-14" y="-8" width="9" height="12" rx="4.5" fill="{esc}"/>'
         f'<rect x="8" y="-8" width="9" height="12" rx="4.5" fill="{esc}"/><rect x="20" y="-8" width="9" height="12" rx="4.5" fill="{esc}"/>'
         f'<rect x="-36" y="-34" width="66" height="30" rx="15" fill="{cor}"/>'
         f'<rect x="14" y="-44" width="30" height="21" rx="9" fill="{cor}"/>'
         f'<rect x="34" y="-38" width="12" height="13" rx="5" fill="{esc}"/>'
         f'<circle cx="18" cy="-44" r="4.2" fill="{esc}"/>'
         f'<circle cx="31" cy="-37" r="2.3" fill="{BASE}"/><circle cx="30.3" cy="-37.8" r=".8" fill="#FFFFFF"/>'
         f'<rect x="-30" y="-30" width="34" height="9" rx="4.5" fill="#FFFFFF" opacity=".10"/>')
    if passarinho:  # o passarinho que sempre senta na cabeça da capivara
        g += (f'<g transform="translate(26 -46)"><path d="M6 -6 L14 -9 L9 -3 Z" fill="{LARANJA}"/>'
              f'<ellipse cx="0" cy="-5" rx="7" ry="5" fill="{SOL}"/><circle cx="4" cy="-9" r="3.6" fill="{SOL}"/>'
              f'<path d="M7 -9.5 L11.5 -8.5 L7 -7.5 Z" fill="{LARANJA}"/><circle cx="4.8" cy="-9.8" r=".9" fill="{BASE}"/>'
              f'<rect x="-11" y="-7" width="8" height="3.2" rx="1.6" fill="{LARANJA}"/></g>')
    s.add(g + "</g>")


def mico(s, x, y, k, o=1):
    """Mico-leão-dourado sentado num galho (o ponto (x,y) é o galho)."""
    sc = k * s.u / 10
    juba, cara = LARANJA, "#7A3A12"
    g = f'<g transform="translate({f1(x)} {f1(y)}) scale({sc:.3f})"{S.op(o)}>'
    g += f'<path d="M6 -6 C 18 4, 16 26, 6 40" fill="none" stroke="{juba}" stroke-width="5" stroke-linecap="round"/>'
    g += f'<rect x="-9" y="-30" width="20" height="28" rx="10" fill="{juba}"/>'
    g += f'<rect x="-10" y="-8" width="8" height="10" rx="4" fill="{mix(juba, BASE, .2)}"/><rect x="4" y="-8" width="8" height="10" rx="4" fill="{mix(juba, BASE, .2)}"/>'
    for a in range(10):  # juba
        t = a * 2 * math.pi / 10
        g += f'<circle cx="{f1(math.cos(t) * 10)}" cy="{f1(-40 + math.sin(t) * 10)}" r="6" fill="{juba}"/>'
    g += f'<circle cx="0" cy="-40" r="10" fill="{juba}"/>'
    g += f'<ellipse cx="0" cy="-38.5" rx="6.4" ry="7.4" fill="{cara}"/>'
    g += f'<circle cx="-2.6" cy="-41" r="1.6" fill="#FFFFFF"/><circle cx="2.6" cy="-41" r="1.6" fill="#FFFFFF"/>'
    g += f'<circle cx="-2.4" cy="-40.8" r=".9" fill="{BASE}"/><circle cx="2.8" cy="-40.8" r=".9" fill="{BASE}"/>'
    g += f'<rect x="-2" y="-36" width="4" height="2" rx="1" fill="{mix(cara, BASE, .4)}"/>'
    s.add(g + "</g>")


def tucano(s, x, y, k, o=1):
    sc = k * s.u / 10
    s.add(f'<g transform="translate({f1(x)} {f1(y)}) scale({sc:.3f})"{S.op(o)}>'
          f'<rect x="-6" y="-2" width="10" height="20" rx="5" fill="#18181B" transform="rotate(14 0 0)"/>'
          f'<ellipse cx="0" cy="-16" rx="11" ry="17" fill="#18181B"/>'
          f'<ellipse cx="3" cy="-24" rx="6.5" ry="8" fill="{BRANCO}"/>'
          f'<path d="M6 -33 C 20 -40, 34 -36, 38 -28 C 28 -26, 16 -25, 6 -25 Z" fill="{LARANJA}"/>'
          f'<path d="M6 -33 C 16 -37, 26 -36, 32 -32 C 22 -31, 14 -30, 6 -30 Z" fill="{SOL}"/>'
          f'<circle cx="2.5" cy="-30" r="2.2" fill="{VERDE_CLARO}"/><circle cx="2.5" cy="-30" r="1.1" fill="{BASE}"/>'
          f'<rect x="-6" y="-2" width="3" height="5" rx="1.5" fill="{LARANJA}"/><rect x="2" y="-2" width="3" height="5" rx="1.5" fill="{LARANJA}"/></g>')


def borboleta(s, x, y, k, cor, cor2, rot=0, o=1):
    sc = k * s.u / 10
    s.add(f'<g transform="translate({f1(x)} {f1(y)}) rotate({rot}) scale({sc:.3f})"{S.op(o)}>'
          f'<circle cx="-6" cy="-5" r="6.5" fill="{cor}"/><circle cx="6" cy="-5" r="6.5" fill="{cor}"/>'
          f'<circle cx="-4.5" cy="5" r="4.2" fill="{cor2}"/><circle cx="4.5" cy="5" r="4.2" fill="{cor2}"/>'
          f'<rect x="-1.2" y="-9" width="2.4" height="18" rx="1.2" fill="{BASE}"/></g>')


def animais(W, H, modo, com_ceu=True):
    s = S(W, H, 11, modo)
    u, r = s.u, s.r
    retrato = H > W
    dia = modo == "dia"
    if com_ceu:
        ceu(s)
    tint = (lambda c, f, t: mix(c, ceu_em(f, modo), t)) if dia else (lambda c, f, t: mix(mix(c, AZUL, 0.35), NOITE, t))
    tronco = "#5B3A29" if dia else "#2A1E1C"
    L = dict(longe=.62, eq=.67, meio=.74, chao=.80, lago=.86) if not retrato else dict(longe=.63, eq=.67, meio=.73, chao=.78, lago=.84)
    morros(s, H * L["longe"], 7 * u, 5, tint(V900, L["longe"] - .05, .6 if dia else .55), seed=8)
    w, gap = 2.3 * u, 1.05 * u
    x, i = -w, 0
    while x < W + w:
        f = 0.5 + 0.30 * math.sin(i * 0.45 + 2) + 0.15 * math.sin(i * 1.3)
        if r.random() < 0.7:
            arvore_pilula(s, x, H * L["eq"], w, (4 + 9 * f) * u, tint(V700, L["eq"] - .08, .52 if dia else .45), tint(tronco, L["eq"], .5), luz=.06)
        x += w + gap
        i += 1
    s.faixa(H * (L["eq"] - .06), H * (L["eq"] + .04), ceu_em(L["eq"] - .05, modo) if dia else "#1B2450", .5)
    campo = mix(V800, "#7C5955", .35) if dia else mix(V900, NOITE, .5)
    morros(s, H * L["meio"], 4 * u, 6, tint(V900, L["meio"], .3), seed=9)
    morros(s, H * L["chao"], 2 * u, 9, campo, seed=10)
    # lago que espelha o céu
    lx, ly = W * (0.36 if not retrato else 0.40), H * L["lago"]
    s.ellipse(lx, ly, (24 if not retrato else 30) * u, 4.6 * u, ceu_em(.25, modo) if dia else "#1A2550")
    s.ellipse(lx - 3 * u, ly - 0.8 * u, 13 * u, 0.5 * u, BRANCO, .35)
    s.ellipse(lx + 8 * u, ly + 1.4 * u, 7 * u, 0.4 * u, BRANCO, .25)
    # árvore grande com galho, mico e tucano
    tx = W * (0.80 if not retrato else 0.76)
    base = H * 0.99
    copa = V600 if dia else mix(V800, AZUL, .3)
    s.rect(tx - 1.6 * u, base - 46 * u, 3.2 * u, 46 * u, tronco, rx=1.6 * u)
    gy = base - 30 * u
    s.rect(tx - 22 * u, gy - 0.9 * u, 22 * u, 1.8 * u, tronco, rx=0.9 * u)
    for dx, dy, k in [(-6, -50, 9), (6, -52, 10), (0, -58, 9), (-12, -46, 7), (12, -45, 7.5)]:
        s.circle(tx + dx * u, base + dy * u, k * u, copa)
    s.circle(tx - 4 * u, base - 57 * u, 3.5 * u, "#FFFFFF", .12 if dia else .05)
    mico(s, tx - 16 * u, gy - 0.9 * u, 1.25)
    tucano(s, tx - 6 * u, gy - 0.9 * u, 1.05)
    # capivara na beira do lago
    capivara(s, W * (0.20 if not retrato else 0.30), H * (L["lago"] + 0.045), 1.45 if not retrato else 1.6,
             "#9A6B47" if dia else "#6E4E39")
    # borboletas
    for fx, fy, k, rot in [(0.50, 0.70, 1.0, -12), (0.58, 0.64, .8, 10), (0.12, 0.66, .7, -6)]:
        borboleta(s, W * fx, H * fy, k, LARANJA, SOL, rot)
    capim(s, H * .84, H, int(W / u * 1.2), [V600, V700, VERDE] if dia else [V800, V700], 1.2, 3.4)
    flores(s, H * .9, H * .995, int(W / u / 8), [SOL, BRANCO, LARANJA])
    if not dia:
        for _ in range(int(W / u / 4)):
            vagalume(s, r.uniform(0, W), r.uniform(H * .5, H * .97), r.uniform(.7, 1.1))
    return s.svg()


# ------------------------------------------------------------------ UNIVERSO
def planeta_anel(s, px, py, pr, cor, anel=LUA, rot=-16, faixa=None):
    u = s.u
    t = f' transform="rotate({rot} {f1(px)} {f1(py)})"'
    sw = f1(0.9 * u + pr * 0.04)
    s.add(f'<ellipse cx="{f1(px)}" cy="{f1(py)}" rx="{f1(pr * 2.05)}" ry="{f1(pr * 0.5)}" fill="none" stroke="{anel}" stroke-width="{sw}" opacity=".9"{t}/>')
    s.circle(px, py, pr, cor)
    if faixa:
        s.add(f'<g{t}><rect x="{f1(px - pr * 0.92)}" y="{f1(py - pr * 0.36)}" width="{f1(pr * 1.84)}" height="{f1(pr * 0.2)}" rx="{f1(pr * 0.1)}" fill="{faixa}" opacity=".5"/>'
              f'<rect x="{f1(px - pr * 0.8)}" y="{f1(py + pr * 0.25)}" width="{f1(pr * 1.6)}" height="{f1(pr * 0.14)}" rx="{f1(pr * 0.07)}" fill="{faixa}" opacity=".4"/></g>')
    s.add(f'<path d="M{f1(px - pr * 2.03)} {f1(py)} A {f1(pr * 2.05)} {f1(pr * 0.5)} 0 0 0 {f1(px + pr * 2.03)} {f1(py)}" fill="none" stroke="{anel}" stroke-width="{sw}"{t}/>')
    s.circle(px - pr * 0.38, py - pr * 0.38, pr * 0.3, "#FFFFFF", .1)


def universo(W, H, modo, com_ceu=True):
    s = S(W, H, 5, modo)
    u, r = s.u, s.r
    retrato = H > W
    dia = modo == "dia"
    if com_ceu:
        ceu(s, nuvens=False)
        if dia:
            for _ in range(60):
                s.circle(r.uniform(0, W), r.uniform(0, H * .8), r.choice([.14, .2, .26]) * u, BRANCO, r.uniform(.25, .6))
    # constelação: cada música acende uma estrela
    pts = [(0.30, 0.30), (0.40, 0.22), (0.50, 0.27), (0.60, 0.18), (0.70, 0.25), (0.78, 0.15), (0.88, 0.22)] if not retrato else \
          [(0.14, 0.30), (0.28, 0.24), (0.42, 0.29), (0.56, 0.21), (0.70, 0.27), (0.82, 0.19), (0.92, 0.25)]
    P = [(W * a, H * b) for a, b in pts]
    d = "M" + " L".join(f"{f1(x)} {f1(y)}" for x, y in P)
    s.add(f'<path d="{d}" fill="none" stroke="{SOL}" stroke-width="{f1(0.22 * u)}" stroke-dasharray="{f1(0.8 * u)} {f1(0.8 * u)}" opacity=".6"/>')
    for i, (x, y) in enumerate(P):
        if i < 5:
            s.circle(x, y, 4 * u, s.glow(SOL, .5))
            brilho(s, x, y, 1.9 * u, SOL)
        else:
            s.circle(x, y, 0.7 * u, BRANCO, .35)
            s.add(f'<circle cx="{f1(x)}" cy="{f1(y)}" r="{f1(1.4 * u)}" fill="none" stroke="{BRANCO}" stroke-width="{f1(.15 * u)}" stroke-dasharray="{f1(.4 * u)} {f1(.4 * u)}" opacity=".5"/>')
    # planeta com anel (o ícone da aba Mundo)
    px, py, pr = W * (0.27 if not retrato else 0.5), H * (0.62 if not retrato else 0.52), (12 if not retrato else 14) * u
    planeta_anel(s, px, py, pr, "#4A2152" if not dia else "#6B4560", faixa="#8A5A8F" if not dia else "#9A7488")
    planeta_anel(s, W * (0.86 if not retrato else 0.2), H * (0.50 if not retrato else 0.70), 3.4 * u, "#1D3A63", rot=12)
    # cometa
    cx0, cy0 = W * (0.62 if not retrato else 0.74), H * (0.46 if not retrato else 0.40)
    s.add(f'<path d="M{f1(cx0)} {f1(cy0)} L{f1(cx0 - 16 * u)} {f1(cy0 + 6 * u)}" stroke="{SOL}" stroke-width="{f1(0.9 * u)}" stroke-linecap="round" opacity=".45"/>')
    s.add(f'<path d="M{f1(cx0)} {f1(cy0)} L{f1(cx0 - 9 * u)} {f1(cy0 + 3.4 * u)}" stroke="{SOL}" stroke-width="{f1(1.3 * u)}" stroke-linecap="round" opacity=".7"/>')
    s.circle(cx0, cy0, 3 * u, s.glow(SOL, .6))
    s.circle(cx0, cy0, 1.1 * u, "#FFE58A")
    # brilhos laranja
    for _ in range(8):
        brilho(s, r.uniform(W * .04, W * .96), r.uniform(H * .05, H * .78), r.uniform(.9, 1.7) * u, r.choice([LARANJA, SOL]), .9)
    # horizonte de um planeta, com borda que brilha
    R = W * 1.6
    cyh = H * (0.985 if not retrato else 0.95) + R - 8 * u
    s.circle(W / 2, cyh, R + 2.6 * u, LARANJA, .18)
    s.circle(W / 2, cyh, R + 1.0 * u, LARANJA, .35)
    s.circle(W / 2, cyh, R, "#1A1033" if not dia else "#2E293D")
    # broto e barras sobre o planeta
    hx = W * (0.72 if not retrato else 0.5)
    hy = cyh - math.sqrt(R * R - (hx - W / 2) ** 2)
    broto(s, hx, hy + 0.3 * u, 7 * u, VERDE)
    return s.svg()


MUNDOS = {"floresta": floresta, "oceano": oceano, "animais": animais, "universo": universo}
FORMATOS = {"paisagem": (1600, 900), "retrato": (1080, 1920)}


# ------------------------------------------------------------------ peças soltas (para o app)
def elemento(nome, W, H, fn):
    s = S(W, H, 1)
    s.u = 1
    fn(s)
    return nome, s.svg()


def elementos():
    E = {}
    E["floresta"] = [
        elemento("arvore-barra", 60, 160, lambda s: arvore_pilula(s, 30, 158, 30, 150, VERDE, "#5B3A29", .15)),
        elemento("arvore-redonda", 120, 160, lambda s: arvore_redonda(s, 60, 158, 150, V600, "#5B3A29", .14)),
        elemento("ipe-amarelo", 170, 190, lambda s: ipe(s, 85, 186, 180, "#5B3A29")),
        elemento("broto", 120, 70, lambda s: broto(s, 62, 68, 64, VERDE)),
        elemento("nota", 60, 90, lambda s: nota(s, 22, 72, 4.2, LARANJA)),
        elemento("vagalume", 40, 40, lambda s: vagalume(s, 20, 20, 10)),
    ]
    E["oceano"] = [
        elemento("peixe", 120, 70, lambda s: peixe(s, 58, 35, 2.8, LARANJA)),
        elemento("peixe-sol", 120, 70, lambda s: peixe(s, 58, 35, 2.8, SOL)),
        elemento("tartaruga", 180, 110, lambda s: tartaruga(s, 96, 56, 2.6, "#15803D", "#86C5A0")),
        elemento("coral", 90, 120, lambda s: [s.pill(25 + i * 20, 118, 15, h, LARANJA) for i, h in enumerate([70, 110, 60])]),
        elemento("agua-viva", 90, 120, lambda s: agua_viva(s, 45, 45, 7, VERDE_CLARO)),
    ]
    E["animais"] = [
        elemento("capivara", 160, 110, lambda s: capivara(s, 70, 104, 2.0, "#9A6B47")),
        elemento("mico-leao-dourado", 90, 160, lambda s: mico(s, 45, 100, 1.4)),
        elemento("tucano", 110, 100, lambda s: tucano(s, 40, 80, 1.8)),
        elemento("borboleta", 60, 60, lambda s: borboleta(s, 30, 30, 2.4, LARANJA, SOL)),
    ]
    E["universo"] = [
        elemento("estrela", 60, 60, lambda s: brilho(s, 30, 30, 26, SOL)),
        elemento("estrela-laranja", 60, 60, lambda s: brilho(s, 30, 30, 26, LARANJA)),
        elemento("planeta", 200, 120, lambda s: planeta_anel(s, 100, 60, 32, "#4A2152", faixa="#8A5A8F")),
        elemento("lua", 80, 80, lambda s: s.add(f'<circle cx="40" cy="40" r="30" fill="{LUA_MIOLO}" stroke="{LUA}" stroke-width="7"/>')),
    ]
    return E


def gerar(out):
    import cairosvg
    for sub in ("mundos", "camadas", "elementos"):
        os.makedirs(os.path.join(out, sub), exist_ok=True)
    n = 0
    for nome, fn in MUNDOS.items():
        for modo in ("dia", "noite"):
            for fmt, (W, H) in FORMATOS.items():
                svg = fn(W, H, modo)
                base = os.path.join(out, "mundos", f"{nome}-{modo}-{fmt}")
                open(base + ".svg", "w").write(svg)
                cairosvg.svg2png(bytestring=svg.encode(), write_to=base + ".png")
                n += 2
            # camada sem céu, para pôr sobre o céu animado do app
            svg = fn(1080, 1920, modo, com_ceu=False)
            png = os.path.join(out, "camadas", f"{nome}-{modo}-camada.png")
            cairosvg.svg2png(bytestring=svg.encode(), write_to=png)
            n += 1
    for mundo, items in elementos().items():
        d = os.path.join(out, "elementos", mundo)
        os.makedirs(d, exist_ok=True)
        for nome, svg in items:
            open(os.path.join(d, nome + ".svg"), "w").write(svg)
            cairosvg.svg2png(bytestring=svg.encode(), write_to=os.path.join(d, nome + ".png"), output_width=None, scale=3)
            n += 2
    return n


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/pm4/ilustracoes"
    print("arquivos:", gerar(out))

// O céu do app, fixo atrás de tudo.
// Noite: planetas, estrelas e a lua em anel. Dia: amanhecer rosa com o sol claro, nuvens,
// passarinhos voando (um bando que dá um looping perto do sol) e colinas verdes no pé da tela.
function estrelas(n: number) {
  let s = 7;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: n }, (_, i) => ({
    x: +(r() * 100).toFixed(2),
    y: +(r() * 100).toFixed(2),
    r: [0.9, 1.1, 1.4, 1.8][Math.floor(r() * 4)],
    pisca: i % 6 === 0,
    atraso: +(r() * 4).toFixed(2),
  }));
}

const ESTRELAS = estrelas(80);

function Ave() {
  return (
    <svg className="ave" viewBox="0 0 22 12" aria-hidden>
      <path d="M1 7 Q6 1 11 6 Q16 1 21 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Ceu() {
  return (
    <div className="ceu" aria-hidden>
      <div className="pl p1" />
      <div className="pl p2" />
      <div className="pl p3" />
      <svg className="estrelas" preserveAspectRatio="none">
        {ESTRELAS.map((e, i) => (
          <circle
            key={i}
            cx={`${e.x}%`}
            cy={`${e.y}%`}
            r={e.r}
            className={e.pisca ? "pisca" : undefined}
            style={e.pisca ? { animationDelay: `${e.atraso}s` } : undefined}
            opacity={e.pisca ? 1 : 0.55 + (i % 5) * 0.09}
          />
        ))}
      </svg>
      <div className="lua" />
      <div className="sol" />
      <div className="nuvens">
        <span className="nuvem" style={{ left: "-40px", top: "34vh", width: 170 }} />
        <span className="nuvem" style={{ right: "-30px", top: "56vh", width: 150, transform: "scale(.8)" }} />
        <span className="nuvem" style={{ left: "18vw", top: "74vh", width: 130, transform: "scale(.7)" }} />
      </div>
      <div className="voo">
        <span className="passaro p-a"><Ave /></span>
        <span className="passaro p-b"><Ave /></span>
        <span className="passaro p-c"><Ave /></span>
        <span className="passaro p-d"><Ave /></span>
      </div>
      <svg className="colinas" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path d="M0 92 C120 58 260 64 380 88 C500 112 620 70 760 66 C860 63 940 80 1000 74 L1000 200 L0 200 Z" fill="#95daa8" />
        <path d="M0 132 C150 104 300 112 450 132 C580 150 700 116 840 112 C920 110 970 118 1000 114 L1000 200 L0 200 Z" fill="#45c474" />
        <path d="M0 168 C140 150 300 174 470 162 C620 152 760 170 900 160 C950 157 980 160 1000 158 L1000 200 L0 200 Z" fill="#22a75a" />
      </svg>
    </div>
  );
}

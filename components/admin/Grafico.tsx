// Gráfico de barras simples em SVG (sem biblioteca): um valor por dia.
export default function Grafico({ titulo, dados, formato = (v: number) => String(v), cor = "#FF8A00" }: {
  titulo: string;
  dados: { rotulo: string; valor: number }[];
  formato?: (v: number) => string;
  cor?: string;
}) {
  const W = 640;
  const H = 210;
  const m = { t: 18, r: 8, b: 26, l: 8 };
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const n = Math.max(1, dados.length);
  const larg = (W - m.l - m.r) / n;
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const ultimo = dados[dados.length - 1];
  return (
    <figure className="cartao forte grafico" style={{ margin: 0 }}>
      <figcaption className="entre" style={{ marginBottom: 10 }}>
        <b>{titulo}</b>
        <span className="pequeno">total {formato(total)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titulo}: total ${formato(total)}`}>
        <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke="rgba(255,255,255,.18)" />
        {dados.map((d, i) => {
          const h = ((H - m.t - m.b) * d.valor) / max;
          const x = m.l + i * larg + larg * 0.18;
          return (
            <g key={i}>
              <rect x={x} y={H - m.b - h} width={larg * 0.64} height={Math.max(h, d.valor ? 2 : 0)} rx={Math.min(4, larg * 0.3)} fill={cor} opacity={i === n - 1 ? 1 : 0.78}>
                <title>{`${d.rotulo}: ${formato(d.valor)}`}</title>
              </rect>
            </g>
          );
        })}
        {dados.length ? (
          <>
            <text x={m.l} y={H - 6} fill="#A1A1AA" fontSize="12">{dados[0].rotulo}</text>
            <text x={W - m.r} y={H - 6} fill="#A1A1AA" fontSize="12" textAnchor="end">{ultimo.rotulo}</text>
          </>
        ) : null}
        <text x={W - m.r} y={12} fill="#A1A1AA" fontSize="12" textAnchor="end">máx. {formato(max)}</text>
      </svg>
    </figure>
  );
}

"use client";

import type { LinhaKaraoke } from "@/components/PalcoProvider";

/** Mostra a linha da letra que está tocando, com a anterior e a próxima. */
export default function Karaoke({ linhas, tempo, letra }: { linhas: LinhaKaraoke[] | null; tempo: number; letra?: string | null }) {
  if (!linhas?.length) {
    if (!letra) return null;
    const simples = letra.split("\n").filter((l) => l.trim() && !/^\[.*\]$/.test(l.trim())).slice(0, 4);
    return (
      <div className="karaoke">
        {simples.map((l, i) => <p key={i}>{l}</p>)}
      </div>
    );
  }
  let i = linhas.findIndex((l) => tempo >= l.t && tempo < l.f);
  if (i < 0) i = tempo < linhas[0].t ? -1 : linhas.findIndex((l) => l.t > tempo) - 1;
  const atual = Math.max(0, i);
  const janela = [atual - 1, atual, atual + 1].filter((k) => k >= 0 && k < linhas.length);
  return (
    <div className="karaoke" aria-live="polite">
      {i < 0 ? <p className="agora">♪</p> : null}
      {janela.map((k) => (
        <p key={k} className={k === i ? "agora" : undefined}>{linhas[k].l}</p>
      ))}
    </div>
  );
}

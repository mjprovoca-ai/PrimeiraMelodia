"use client";

import Link from "next/link";
import { usePalco } from "@/components/PalcoProvider";
import { IcPause, IcPlay, IcSeta } from "@/components/Icones";

/** O botão redondo do canto: toca o Palco ao vivo de qualquer tela (de dia ele vira o sol). */
export default function MiniPalco() {
  const p = usePalco();
  if (!p) return null;
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className={`mini${p.tocando ? " tocando" : ""}`}
        onClick={p.alternar}
        aria-label={p.tocando ? "Pausar o Palco" : "Ouvir o Palco ao vivo"}
        title={p.item ? `${p.item.titulo} · ${p.item.autor}` : "Palco ao vivo"}
      >
        <svg className="raios" viewBox="0 0 80 80" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="38" y="2" width="4" height="10" rx="2" fill="currentColor" transform={`rotate(${i * 45} 40 40)`} />
          ))}
        </svg>
        <span className="disco-mini">{p.tocando ? <IcPause /> : <IcPlay style={{ marginLeft: 3 }} />}</span>
        {p.tocando && p.aoVivo ? <i className="vivo" aria-hidden /> : null}
      </button>
      <Link href="/palco" className="mini-ir" aria-label="Abrir o Palco" prefetch={false}
        style={{ position: "absolute", right: -2, bottom: -2, width: 24, height: 24, borderRadius: "50%", background: "#18181b",
          color: "#fafafa", display: "grid", placeItems: "center", border: "2px solid rgba(255,255,255,.12)" }}>
        <IcSeta style={{ width: 12, height: 12 }} />
      </Link>
    </div>
  );
}

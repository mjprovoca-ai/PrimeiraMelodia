"use client";

import Link from "next/link";
import { useState } from "react";
import { MUNDOS, dataCurta, type Mundo } from "@/lib/dados";

export type ItemCena = {
  id: string;
  item_id: string;
  arte: string;
  nome: string;
  zona: string;
  largura: number;
  x: number;
  y: number;
  origem?: string;
  criacao_id?: string | null;
  criacao_titulo?: string | null;
  created_at?: string;
};

const ORIGEM: Record<string, string> = {
  musica: "Nasceu de uma música",
  meta: "Prêmio de conquista",
  loja: "Comprado na Lojinha",
  "boas-vindas": "Presente de boas-vindas",
  admin: "Presente da Primeira Melodia",
};

/** O mundo da pessoa: a paisagem do kit e, por cima, um item para cada música, conquista ou compra. */
export default function Cena({ mundo, itens, novo, publico = false, mini = false }: { mundo: Mundo; itens: ItemCena[]; novo?: string; publico?: boolean; mini?: boolean }) {
  const [aberto, setAberto] = useState<ItemCena | null>(null);
  const escala = itens.length < 6 ? 1.35 : itens.length < 15 ? 1.15 : itens.length < 40 ? 1 : 0.85;
  const estrelas = mundo === "universo"
    ? itens.filter((i) => i.zona === "ceu" && i.item_id.startsWith("estrela")).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    : [];
  return (
    <div className="cena" style={mini ? { pointerEvents: "none", borderRadius: 0, border: 0 } : undefined} onClick={(e) => { if (e.target === e.currentTarget) setAberto(null); }}>
      <div className="ceu-cena" />
      <img className="fundo-cena so-dia" src={`/mundos/base/${mundo}-dia.svg`} alt="" />
      <img className="fundo-cena so-noite" src={`/mundos/base/${mundo}-noite.svg`} alt="" />
      {estrelas.length > 1 ? (
        <svg className="constelacao" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points={estrelas.map((e) => `${e.x * 100},${e.y * 100 - 1.5}`).join(" ")} fill="none" stroke="#FFC93A" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.6" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
      {itens.map((it) => {
        const persp = it.zona === "ceu" || it.zona === "ar" ? 1 : 0.72 + 0.5 * it.y;
        const largura = Math.min(0.42, Number(it.largura) * persp * escala) * 100;
        return (
          <button
            key={it.id}
            type="button"
            className={`it${it.zona === "ceu" ? " ceu-it" : ""}${novo && it.criacao_id === novo ? " novo" : ""}`}
            style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: `${largura}%`, zIndex: Math.round(it.y * 100) }}
            onClick={() => setAberto(it)}
            aria-label={it.nome}
          >
            <img src={`/mundos/elementos/${it.arte}`} alt="" draggable={false} />
          </button>
        );
      })}
      {mini ? null : <span className="placa">{MUNDOS[mundo].emoji} {itens.length} {itens.length === 1 ? "item" : "itens"}</span>}
      {aberto ? (
        <div className="balao" role="dialog" aria-label={aberto.nome}>
          <div className="entre">
            <b>{aberto.nome}</b>
            <button type="button" className="link" style={{ padding: 0 }} onClick={() => setAberto(null)}>fechar</button>
          </div>
          <p className="pequeno">{ORIGEM[aberto.origem ?? ""] ?? ""}{aberto.created_at ? ` · ${dataCurta(aberto.created_at)}` : ""}</p>
          {!publico && aberto.criacao_id ? (
            <Link href={`/minhas/${aberto.criacao_id}`} className="laranja" style={{ fontWeight: 700 }}>
              ♪ {aberto.criacao_titulo ?? "Ouvir a música"}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

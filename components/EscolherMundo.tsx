"use client";

import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { MUNDOS, ORDEM_MUNDOS, type Mundo } from "@/lib/dados";
import Cena, { type ItemCena } from "@/components/Cena";

const it = (id: string, arte: string, zona: string, largura: number, x: number, y: number): ItemCena =>
  ({ id: `${arte}-${x}`, item_id: id, arte, nome: id, zona, largura, x, y });

// três ou quatro itens de amostra em cada mundo, só para mostrar como ele fica
const EXEMPLOS: Record<Mundo, ItemCena[]> = {
  floresta: [it("arvore-redonda", "floresta/arvore-redonda.svg", "chao", 0.2, 0.28, 0.74), it("ipe-amarelo", "floresta/ipe-amarelo.svg", "chao", 0.24, 0.68, 0.77), it("broto", "floresta/broto.svg", "chao", 0.12, 0.48, 0.8)],
  oceano: [it("peixe", "oceano/peixe.svg", "agua", 0.2, 0.3, 0.4), it("tartaruga", "oceano/tartaruga.svg", "agua", 0.3, 0.64, 0.58), it("coral", "oceano/coral.svg", "fundo", 0.14, 0.22, 0.74)],
  animais: [it("capivara", "animais/capivara.svg", "chao", 0.26, 0.32, 0.78), it("tucano", "animais/tucano.svg", "chao", 0.17, 0.72, 0.75), it("borboleta", "animais/borboleta.svg", "ar", 0.1, 0.6, 0.5)],
  universo: [it("estrela", "universo/estrela.svg", "ceu", 0.1, 0.22, 0.2), it("estrela", "universo/estrela.svg", "ceu", 0.09, 0.55, 0.14), it("estrela-laranja", "universo/estrela-laranja.svg", "ceu", 0.1, 0.8, 0.26), it("planeta", "universo/planeta.svg", "ceu", 0.36, 0.5, 0.58)],
};

export default function EscolherMundo({ atual, volta, trocar }: { atual: Mundo | null; volta: string; trocar: boolean }) {
  const [escolha, setEscolha] = useState<Mundo | null>(atual);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    if (!escolha) return;
    setEnviando(true);
    setErro(null);
    const { error } = await supabaseNavegador().rpc("escolher_mundo", { p_mundo: escolha });
    if (error) {
      setErro(mensagemErro(error));
      setEnviando(false);
    } else window.location.href = volta;
  }

  return (
    <div className="mt24">
      <div className="mundos-escolha" role="group" aria-label="Mundos">
        {ORDEM_MUNDOS.map((m) => (
          <button key={m} type="button" className="mundo-op" aria-pressed={escolha === m} onClick={() => setEscolha(m)}>
            <span className="mundo-cena"><Cena mundo={m} itens={EXEMPLOS[m]} mini /></span>
            <span className="mundo-rotulo">{MUNDOS[m].emoji} {MUNDOS[m].nome}<small>{MUNDOS[m].frase}</small></span>
          </button>
        ))}
      </div>
      {trocar ? <p className="pequeno mt12">Seus itens ficam guardados em cada mundo. Se voltar, eles estão lá.</p> : null}
      {erro ? <p className="erro-msg mt12">{erro}</p> : null}
      <button type="button" className="btn btn-pri mt20" disabled={!escolha || enviando} onClick={confirmar}>
        {enviando ? "Preparando seu mundo…" : escolha ? `Começar no mundo ${MUNDOS[escolha].nome}` : "Escolha um mundo"}
      </button>
    </div>
  );
}

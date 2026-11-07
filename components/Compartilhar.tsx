"use client";

import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { IcCompartilhar, IcCopiar, IcOk, IcWhats } from "@/components/Icones";

export default function Compartilhar({ criacaoId, titulo, link, desativado }: { criacaoId: string; titulo: string; link: string; desativado?: string }) {
  const [copiado, setCopiado] = useState(false);
  const texto = `Fiz uma música no Primeira Melodia: "${titulo}". Escuta aqui 🎶`;

  function registrar(canal: string) {
    supabaseNavegador().rpc("registrar_compartilhamento", { p_criacao: criacaoId, p_canal: canal }).then(() => {}, () => {});
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      registrar("link");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem área de transferência */
    }
  }
  async function nativo() {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url: link });
        registrar("nativo");
      } catch {
        /* cancelado */
      }
    } else copiar();
  }

  if (desativado) return <p className="pequeno">{desativado}</p>;
  return (
    <div className="pilha">
      <a className="btn btn-verde" href={`https://wa.me/?text=${encodeURIComponent(`${texto} ${link}`)}`} target="_blank" rel="noopener" onClick={() => registrar("whatsapp")}>
        <IcWhats /> Mandar no WhatsApp
      </a>
      <div className="linha-flex">
        <button type="button" className="btn btn-sec" onClick={copiar}>{copiado ? <><IcOk /> Link copiado</> : <><IcCopiar /> Copiar link</>}</button>
        <button type="button" className="btn btn-sec" onClick={nativo} aria-label="Compartilhar"><IcCompartilhar /> Mais</button>
      </div>
      <p className="pequeno">Quem abrir o link ouve dentro do app e pode criar a própria música. Se a pessoa entrar pelo seu link, conta como convite. 💚</p>
    </div>
  );
}

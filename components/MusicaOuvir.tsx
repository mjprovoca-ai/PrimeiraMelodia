"use client";

import { useEffect, useState } from "react";
import Player from "@/components/Player";
import Karaoke from "@/components/Karaoke";

export default function MusicaOuvir({ faixas, karaoke, letra, convite }: {
  faixas: { id: string; versao: number; storage_path: string; duracao: number }[];
  karaoke: { t: number; f: number; l: string }[] | null;
  letra: string | null;
  convite: string;
}) {
  const [tempo, setTempo] = useState(0);
  const [versao, setVersao] = useState(1);
  useEffect(() => {
    if (convite && !document.cookie.includes("pm-convite=")) {
      document.cookie = `pm-convite=${convite}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }
  }, [convite]);
  return (
    <>
      <div className="pilha mt24">
        {faixas.map((f) => (
          <Player key={f.id} faixaId={f.id} caminho={f.storage_path} rotulo={`Versão ${f.versao}`} duracao={Number(f.duracao)} origem="link"
            onTempo={(t) => { setVersao(f.versao); setTempo(t); }} />
        ))}
      </div>
      <Karaoke linhas={versao === 1 ? karaoke : null} tempo={tempo} letra={letra} />
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";

/** Botão que chama uma função do banco e atualiza a página. */
export default function BotaoRpc({ fn, args, rotulo, confirmar, classe = "btn btn-sec btn-p" }: {
  fn: string;
  args: Record<string, unknown>;
  rotulo: string;
  confirmar?: string;
  classe?: string;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function ir() {
    if (confirmar && !window.confirm(confirmar)) return;
    setOcupado(true);
    setErro(null);
    const { error } = await supabaseNavegador().rpc(fn, args);
    setOcupado(false);
    if (error) setErro(mensagemErro(error));
    else router.refresh();
  }
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button type="button" className={classe} onClick={ir} disabled={ocupado}>{ocupado ? "…" : rotulo}</button>
      {erro ? <span style={{ color: "#fca5a5", fontSize: 12 }}>{erro}</span> : null}
    </span>
  );
}

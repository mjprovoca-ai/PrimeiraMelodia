"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";

type Cfg = { modo_teste: boolean; palco_moderacao_previa: boolean; aviso: string; fundo_percentual: number; pix_minutos: number; ntfy_topico: string };

export default function FormConfig({ inicial }: { inicial: Cfg }) {
  const router = useRouter();
  const [c, setC] = useState(inicial);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setMsg(null);
    const sb = supabaseNavegador();
    const pares: [string, unknown][] = [
      ["modo_teste", c.modo_teste],
      ["palco_moderacao_previa", c.palco_moderacao_previa],
      ["aviso", c.aviso.trim()],
      ["fundo_percentual", Number(c.fundo_percentual)],
      ["pix_minutos", Math.max(30, Number(c.pix_minutos))],
      ["ntfy_topico", c.ntfy_topico.trim()],
    ];
    for (const [k, v] of pares) {
      const { error } = await sb.rpc("admin_config", { p_chave: k, p_valor: v });
      if (error) {
        setMsg({ ok: false, t: mensagemErro(error) });
        setOcupado(false);
        return;
      }
    }
    setOcupado(false);
    setMsg({ ok: true, t: "Configurações salvas." });
    router.refresh();
  }

  return (
    <form className="cartao forte pilha" onSubmit={salvar}>
      <b style={{ fontSize: 18 }}>Configurações</b>
      <label className="alternar"><input type="checkbox" checked={c.modo_teste} onChange={(e) => setC({ ...c, modo_teste: e.target.checked })} />
        <span><b>Mostrar aviso de “ambiente de testes”</b><br /><span className="pequeno">Desligue quando a V2 for para o público.</span></span></label>
      <label className="alternar"><input type="checkbox" checked={c.palco_moderacao_previa} onChange={(e) => setC({ ...c, palco_moderacao_previa: e.target.checked })} />
        <span><b>Aprovar músicas antes de irem ao Palco</b><br /><span className="pequeno">Desligado: entram direto e você tira as que não combinam.</span></span></label>
      <div className="campo-grupo"><label htmlFor="aviso">Aviso no topo do app (opcional)</label>
        <input id="aviso" className="campo" value={c.aviso} onChange={(e) => setC({ ...c, aviso: e.target.value })} placeholder="Ex.: Promoção de Natal com o cupom NATAL20" /></div>
      <div className="grade-2">
        <div className="campo-grupo"><label htmlFor="fundo">% para o fundo ESG</label>
          <input id="fundo" className="campo" type="number" min={0} max={100} value={c.fundo_percentual} onChange={(e) => setC({ ...c, fundo_percentual: Number(e.target.value) })} /></div>
        <div className="campo-grupo"><label htmlFor="pix">Minutos para pagar o Pix</label>
          <input id="pix" className="campo" type="number" min={30} max={1440} value={c.pix_minutos} onChange={(e) => setC({ ...c, pix_minutos: Number(e.target.value) })} /></div>
      </div>
      <div className="campo-grupo"><label htmlFor="ntfy">Tópico do aviso no celular (ntfy)</label>
        <input id="ntfy" className="campo" value={c.ntfy_topico} onChange={(e) => setC({ ...c, ntfy_topico: e.target.value })} />
        <span className="ajuda">No app ntfy, assine este tópico para receber Pix recebido, músicas para aprovar, projetos ESG e erros. Trate como senha.</span></div>
      {msg ? <p className={msg.ok ? "ok-msg" : "erro-msg"}>{msg.t}</p> : null}
      <button className="btn btn-pri" disabled={ocupado}>{ocupado ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}

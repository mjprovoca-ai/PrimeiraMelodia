"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/config";

export default function FormCupom() {
  const router = useRouter();
  const [f, setF] = useState({ codigo: "", percentual: 100, usos: "", validade: "", descricao: "", umPorPessoa: true });
  const [msg, setMsg] = useState<{ ok: boolean; t: string; codigo?: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setMsg(null);
    const { data, error } = await supabaseNavegador().rpc("admin_criar_cupom", {
      p_codigo: f.codigo,
      p_percentual: Number(f.percentual),
      p_usos_max: f.usos ? Number(f.usos) : null,
      p_valido_ate: f.validade ? new Date(`${f.validade}T23:59:59-03:00`).toISOString() : null,
      p_descricao: f.descricao,
      p_um_por_pessoa: f.umPorPessoa,
    });
    setOcupado(false);
    if (error) setMsg({ ok: false, t: mensagemErro(error) });
    else {
      setMsg({ ok: true, t: `Cupom ${data} criado.`, codigo: String(data) });
      setF({ ...f, codigo: "", descricao: "" });
      router.refresh();
    }
  }

  return (
    <form className="cartao forte pilha" onSubmit={criar}>
      <b style={{ fontSize: 18 }}>Novo cupom</b>
      <div className="chips">
        {[100, 20].map((p) => (
          <button key={p} type="button" className="chip laranja-on" aria-pressed={Number(f.percentual) === p} onClick={() => setF({ ...f, percentual: p })}>
            {p === 100 ? "100% · música grátis" : "20% de desconto"}
          </button>
        ))}
        <label className="chip" style={{ cursor: "text" }}>
          outro: <input type="number" min={1} max={100} value={f.percentual} onChange={(e) => setF({ ...f, percentual: Number(e.target.value) })} style={{ width: 56, background: "transparent", border: 0, color: "inherit", fontWeight: 800 }} />%
        </label>
      </div>
      <div className="grade-2">
        <input className="campo" placeholder="Código (vazio = gerar automático)" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })} />
        <input className="campo" placeholder="Limite de usos (vazio = sem limite)" type="number" min={1} value={f.usos} onChange={(e) => setF({ ...f, usos: e.target.value })} />
        <input className="campo" type="date" value={f.validade} onChange={(e) => setF({ ...f, validade: e.target.value })} aria-label="Válido até" />
        <input className="campo" placeholder="Para quem / campanha (opcional)" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
      </div>
      <label className="alternar"><input type="checkbox" checked={f.umPorPessoa} onChange={(e) => setF({ ...f, umPorPessoa: e.target.checked })} /> <span>Uma vez por pessoa</span></label>
      {msg ? (
        <p className={msg.ok ? "ok-msg" : "erro-msg"}>
          {msg.t}{msg.codigo ? <> Link pronto para mandar: <b>{SITE_URL}/comprar?cupom={msg.codigo}</b></> : null}
        </p>
      ) : null}
      <button className="btn btn-pri" disabled={ocupado}>{ocupado ? "Criando…" : "Criar cupom"}</button>
    </form>
  );
}

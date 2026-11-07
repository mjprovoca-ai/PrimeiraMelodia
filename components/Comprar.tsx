"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { brl } from "@/lib/dados";

type Pacote = { id: number; nome: string; creditos: number; preco_centavos: number; destaque: boolean };

export default function Comprar({ pacotes, saldo, volta, cupomInicial }: { pacotes: Pacote[]; saldo: number; volta: string; cupomInicial: string }) {
  const router = useRouter();
  const [escolhido, setEscolhido] = useState<number>(pacotes.find((p) => p.destaque)?.id ?? pacotes[0]?.id);
  const [cupom, setCupom] = useState(cupomInicial);
  const [validacao, setValidacao] = useState<{ ok: boolean; mensagem: string; valor_final?: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pacote = pacotes.find((p) => p.id === escolhido);

  async function validar() {
    if (!cupom.trim() || !escolhido) return;
    const { data, error } = await supabaseNavegador().rpc("validar_cupom", { p_codigo: cupom, p_pacote: escolhido });
    if (error) setValidacao({ ok: false, mensagem: mensagemErro(error) });
    else setValidacao(data as { ok: boolean; mensagem: string; valor_final?: number });
  }

  async function pagar() {
    setEnviando(true);
    setErro(null);
    try {
      const { data, error } = await supabaseNavegador().rpc("criar_pedido", { p_pacote: escolhido, p_cupom: cupom.trim() || null });
      if (error) throw error;
      const p = data as { id: string; status: string };
      if (p.status === "pago") {
        router.push(`${volta}${volta.includes("?") ? "&" : "?"}creditos=ok`);
        router.refresh();
      } else {
        router.push(`/pedido/${p.id}?volta=${encodeURIComponent(volta)}`);
      }
    } catch (e) {
      setErro(mensagemErro(e));
      setEnviando(false);
    }
  }

  const valorFinal = validacao?.ok && validacao.valor_final !== undefined ? validacao.valor_final : pacote?.preco_centavos;

  return (
    <div className="mt24">
      <div className="pacotes" role="group" aria-label="Pacotes">
        {pacotes.map((p) => (
          <button key={p.id} type="button" className="pacote" aria-pressed={p.id === escolhido}
            onClick={() => { setEscolhido(p.id); setValidacao(null); }}>
            <span>
              <b>{p.nome}{p.destaque ? <span className="selo">MAIS ESCOLHIDO</span> : null}</b>
              <span className="pequeno">{brl(Math.round(p.preco_centavos / p.creditos))} por música</span>
            </span>
            <span className="valor">{brl(p.preco_centavos)}</span>
          </button>
        ))}
      </div>

      <div className="campo-grupo mt20">
        <label htmlFor="cupom">Tem um cupom?</label>
        <div className="linha-flex">
          <input id="cupom" className="campo" placeholder="CÓDIGO" value={cupom} onChange={(e) => { setCupom(e.target.value.toUpperCase()); setValidacao(null); }} autoCapitalize="characters" />
          <button type="button" className="btn btn-sec btn-p" onClick={validar} disabled={!cupom.trim()}>Aplicar</button>
        </div>
        {validacao ? <p className={validacao.ok ? "ok-msg" : "erro-msg"}>{validacao.mensagem}</p> : null}
      </div>

      {erro ? <p className="erro-msg mt16" role="alert">{erro}</p> : null}
      <button type="button" className="btn btn-pri mt20" onClick={pagar} disabled={enviando || !pacote}>
        {enviando ? "Preparando…" : valorFinal === 0 ? "Liberar com o cupom" : `Pagar ${brl(valorFinal)} com Pix`}
      </button>
      <p className="pequeno centro mt12">Você tem {saldo} {saldo === 1 ? "crédito" : "créditos"}. 10% de cada compra vai para o fundo ESG. 💚</p>
    </div>
  );
}

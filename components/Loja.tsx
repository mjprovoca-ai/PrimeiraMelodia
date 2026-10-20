"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { MUNDOS, ORDEM_MUNDOS, type Mundo } from "@/lib/dados";
import { IcSemente } from "@/components/Icones";

type Item = { id: string; mundo: Mundo; nome: string; arte: string; preco_sementes: number; descricao: string | null; especial: number | null };

export default function Loja({ itens, mundo, sementes }: { itens: Item[]; mundo: Mundo; sementes: number }) {
  const router = useRouter();
  const [aba, setAba] = useState<Mundo>(mundo);
  const [saldo, setSaldo] = useState(sementes);
  const [comprando, setComprando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function comprar(it: Item) {
    setComprando(it.id);
    setMsg(null);
    const { data, error } = await supabaseNavegador().rpc("comprar_item", { p_item: it.id });
    setComprando(null);
    if (error) setMsg({ ok: false, t: mensagemErro(error) });
    else {
      setSaldo((data as { sementes: number }).sementes);
      setMsg({ ok: true, t: `${it.nome} entrou no seu mundo!` });
      router.refresh();
    }
  }

  return (
    <div className="mt20">
      <div className="entre">
        <span className="etiqueta verde-e"><IcSemente /> {saldo} sementes</span>
        <a href="/mundo" className="pequeno">Ver meu mundo →</a>
      </div>
      <div className="chips mt16" role="tablist" aria-label="Mundos">
        {ORDEM_MUNDOS.map((m) => (
          <button key={m} type="button" role="tab" className="chip laranja-on" aria-pressed={aba === m} onClick={() => setAba(m)}>
            {MUNDOS[m].emoji} {MUNDOS[m].nome}
          </button>
        ))}
      </div>
      {aba !== mundo ? <p className="pequeno mt12">Estes itens são do mundo {MUNDOS[aba].nome}. Para comprar, troque de mundo no Perfil ou no Mundo.</p> : null}
      {msg ? <p className={`${msg.ok ? "ok-msg" : "erro-msg"} mt12`}>{msg.t}</p> : null}
      <div className="loja-grade mt16">
        {itens.filter((i) => i.mundo === aba).map((it) => (
          <div key={it.id} className="cartao loja-item">
            <div className="arte"><img src={`/mundos/elementos/${it.arte}`} alt="" /></div>
            <b>{it.nome}{it.especial ? " ✨" : ""}</b>
            <span className="pequeno">{it.descricao}</span>
            <span className="preco"><IcSemente /> {it.preco_sementes}</span>
            <button type="button" className="btn btn-pri btn-p" style={{ width: "100%" }}
              disabled={aba !== mundo || saldo < it.preco_sementes || comprando === it.id} onClick={() => comprar(it)}>
              {comprando === it.id ? "Plantando…" : saldo < it.preco_sementes ? "Faltam sementes" : "Comprar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { chamarFuncao, mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/config";
import { STATUS_CRIACAO, dataHora, nomeEstilo } from "@/lib/dados";
import Player from "@/components/Player";
import Karaoke from "@/components/Karaoke";
import Compartilhar from "@/components/Compartilhar";
import type { LinhaKaraoke } from "@/components/PalcoProvider";
import { IcVoltar } from "@/components/Icones";

type Criacao = {
  id: string;
  titulo: string;
  para_quem: string | null;
  historia: string | null;
  tem_letra: boolean;
  letra: string | null;
  estilo: string;
  voz: string;
  mundo: string;
  status: string;
  publico: string;
  motivo_recusa: string | null;
  karaoke: LinhaKaraoke[] | null;
  created_at: string;
  pronta_em: string | null;
  faixas: { id: string; versao: number; storage_path: string; duracao: number; formato: string }[];
  plays: number;
  item: { item_id: string; nome: string; arte: string } | null;
};

export default function MinhaMusica({ inicial, nova, convite }: { inicial: Criacao; nova: boolean; convite: string }) {
  const [c, setC] = useState(inicial);
  const [tempo, setTempo] = useState(0);
  const [versaoTocando, setVersaoTocando] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [licenca, setLicenca] = useState(false);
  const [lic, setLic] = useState({ tipo: "publicidade", descricao: "", contato: "" });
  const [licOk, setLicOk] = useState(false);
  const cutucou = useRef(false);

  const emAndamento = c.status === "na_fila" || c.status === "gerando";

  useEffect(() => {
    if (!emAndamento) return;
    if (!cutucou.current) {
      cutucou.current = true;
      chamarFuncao("musica/agora").catch(() => {});
    }
    const t = setInterval(async () => {
      const { data } = await supabaseNavegador().rpc("minha_criacao", { p_id: c.id });
      if (data) setC(data as Criacao);
    }, 5000);
    return () => clearInterval(t);
  }, [c.id, emAndamento]);

  async function alternarPalco(publica: boolean) {
    setErro(null);
    const { data, error } = await supabaseNavegador().rpc("definir_palco", { p_criacao: c.id, p_publica: publica });
    if (error) setErro(mensagemErro(error));
    else setC((x) => ({ ...x, publico: String(data) }));
  }

  async function pedirLicenca(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const { error } = await supabaseNavegador().rpc("pedir_licenca", { p_criacao: c.id, p_tipo: lic.tipo, p_descricao: lic.descricao, p_contato: lic.contato });
    if (error) setErro(mensagemErro(error));
    else setLicOk(true);
  }

  const st = STATUS_CRIACAO[c.status] ?? { rotulo: c.status, cor: "var(--cinza)" };
  const link = `${SITE_URL}/m/${c.id}${convite ? `?c=${convite}` : ""}`;
  const karaoke = versaoTocando === 1 ? c.karaoke : null;

  return (
    <>
      <Link href="/minhas" className="voltar"><IcVoltar /> Minhas músicas</Link>
      <p className="olho mt20">{c.para_quem ? `Para ${c.para_quem}` : "Minha música"}</p>
      <h1 className="titulo">{c.titulo}</h1>
      <p className="sub"><span style={{ color: st.cor, fontWeight: 800 }}>{st.rotulo}</span> · {nomeEstilo(c.estilo)} · voz {c.voz} · {dataHora(c.created_at)}</p>

      {emAndamento ? (
        <div className="cartao centro mt24">
          <div className="linha-flex" style={{ justifyContent: "center", gap: 6, height: 56, alignItems: "flex-end" }} aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{ width: 12, borderRadius: 6, background: i === 2 ? "var(--verde)" : "var(--laranja)", height: "100%", animation: `eqpulso 1.1s ${i * 0.12}s ease-in-out infinite` }} />
            ))}
          </div>
          <h2 className="mt16">{nova ? "Sua música entrou no estúdio!" : "Criando sua música…"}</h2>
          <p className="sub">Leva uns 2 a 4 minutos. Pode navegar à vontade: avisamos aqui e em Perfil quando ficar pronta.</p>
          <style>{`@keyframes eqpulso{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}span[style*=eqpulso]{transform-origin:bottom}`}</style>
        </div>
      ) : null}

      {c.status === "erro" || c.status === "recusada" ? (
        <div className="cartao mt24">
          <h2>{c.status === "recusada" ? "Essa história não virou música" : "Não conseguimos criar desta vez"}</h2>
          <p className="sub">{c.motivo_recusa || "Algo falhou no estúdio."} Seu crédito voltou para a sua conta.</p>
          <Link href="/criar" className="btn btn-pri mt16">Tentar de novo</Link>
        </div>
      ) : null}

      {c.status === "pronta" ? (
        <>
          <div className="pilha mt24">
            {c.faixas.map((f) => (
              <div key={f.id} onClick={() => setVersaoTocando(f.versao)}>
                <Player faixaId={f.id} caminho={f.storage_path} rotulo={`Versão ${f.versao}`} duracao={Number(f.duracao)} onTempo={(t) => { setVersaoTocando(f.versao); setTempo(t); }} />
              </div>
            ))}
          </div>
          <Karaoke linhas={karaoke} tempo={tempo} letra={c.letra} />
          {c.item ? (
            <Link href="/mundo" className="cartao verde-bg linha-flex mt16" style={{ textDecoration: "none" }}>
              <img src={`/mundos/elementos/${c.item.arte}`} alt="" width={48} height={48} style={{ objectFit: "contain" }} />
              <span><b>{c.item.nome}</b> entrou no seu mundo. <span className="verde">Ver mundo →</span></span>
            </Link>
          ) : null}

          <h2 className="rotulo-secao">Palco</h2>
          <div className="cartao">
            {c.publico === "removida" ? (
              <p className="sub" style={{ marginTop: 0 }}>A curadoria tirou esta música do Palco. Ela continua aqui para você ouvir.</p>
            ) : (
              <label className="alternar">
                <input type="checkbox" checked={c.publico === "publica" || c.publico === "em_analise"} onChange={(e) => alternarPalco(e.target.checked)} />
                <span><b>{c.publico === "em_analise" ? "Aguardando a curadoria para o Palco" : "Tocar no Palco"}</b><br />
                  <span className="pequeno">Pública: entra na fila da boate e o link de compartilhar funciona para todo mundo.</span></span>
              </label>
            )}
          </div>

          <h2 className="rotulo-secao">Compartilhar</h2>
          <div className="cartao">
            <Compartilhar criacaoId={c.id} titulo={c.titulo} link={link}
              desativado={c.publico === "publica" ? undefined : "Para compartilhar o link, deixe a música no Palco (pública)."} />
          </div>

          {c.letra ? (
            <>
              <h2 className="rotulo-secao">Letra</h2>
              <div className="cartao"><p style={{ whiteSpace: "pre-wrap", color: "#e4e4e7" }}>{c.letra}</p></div>
            </>
          ) : null}

          <h2 className="rotulo-secao">Uso comercial</h2>
          <div className="cartao">
            <p className="sub" style={{ marginTop: 0 }}>Os direitos são 50% seus e 50% da plataforma. Para usar em publicidade, marca ou mídia, fale com a gente antes.</p>
            {licOk ? <p className="ok-msg mt12">Recebemos seu pedido. Vamos responder pelo seu e-mail. 💚</p> : licenca ? (
              <form className="pilha mt12" onSubmit={pedirLicenca}>
                <div className="chips">
                  {[["publicidade", "Publicidade"], ["marca", "Marca"], ["midia", "TV, rádio ou streaming"], ["outro", "Outro"]].map(([v, n]) => (
                    <button key={v} type="button" className="chip laranja-on" aria-pressed={lic.tipo === v} onClick={() => setLic({ ...lic, tipo: v })}>{n}</button>
                  ))}
                </div>
                <textarea className="campo" placeholder="Conte como você quer usar a música" value={lic.descricao} onChange={(e) => setLic({ ...lic, descricao: e.target.value })} required minLength={10} />
                <input className="campo" placeholder="Telefone ou outro contato (opcional)" value={lic.contato} onChange={(e) => setLic({ ...lic, contato: e.target.value })} />
                <button className="btn btn-pri">Enviar pedido</button>
              </form>
            ) : (
              <button type="button" className="btn btn-sec mt12" onClick={() => setLicenca(true)}>Quero usar comercialmente</button>
            )}
          </div>
        </>
      ) : null}

      {c.historia ? (
        <details className="cartao mt24">
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>A história que você contou</summary>
          <p className="sub" style={{ whiteSpace: "pre-wrap" }}>{c.historia}</p>
        </details>
      ) : null}
      {erro ? <p className="erro-msg mt16" role="alert">{erro}</p> : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { chamarFuncao, mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { ESTILOS, nomeEstilo } from "@/lib/dados";
import { IcBrilho, IcDoc } from "@/components/Icones";

type Rascunho = {
  passo: number;
  temLetra: boolean | null;
  titulo: string;
  paraQuem: string;
  historia: string;
  letra: string;
  estilo: string;
  voz: "feminina" | "masculina";
  palco: boolean;
};

const VAZIO: Rascunho = { passo: 1, temLetra: null, titulo: "", paraQuem: "", historia: "", letra: "", estilo: "", voz: "feminina", palco: true };
const CHAVE = "pm-rascunho";

export default function CriarWizard({ creditos }: { creditos: number }) {
  const router = useRouter();
  const [r, setR] = useState<Rascunho>(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) setR({ ...VAZIO, ...JSON.parse(salvo) });
    } catch {
      /* sem rascunho */
    }
  }, []);

  function mudar(p: Partial<Rascunho>) {
    setR((atual) => {
      const novo = { ...atual, ...p };
      try {
        localStorage.setItem(CHAVE, JSON.stringify(novo));
      } catch {
        /* tudo bem */
      }
      return novo;
    });
    setErro(null);
  }

  const podeAvancar2 = r.temLetra
    ? r.letra.trim().length >= 20
    : r.historia.trim().length >= 15;

  async function criar() {
    setEnviando(true);
    setErro(null);
    try {
      const sb = supabaseNavegador();
      const { data, error } = await sb.rpc("criar_musica", {
        p_titulo: r.titulo,
        p_para_quem: r.paraQuem,
        p_historia: r.temLetra ? null : r.historia,
        p_tem_letra: Boolean(r.temLetra),
        p_letra: r.temLetra ? r.letra : null,
        p_estilo: r.estilo || "pop",
        p_voz: r.voz,
        p_palco: r.palco,
      });
      if (error) throw error;
      try {
        localStorage.removeItem(CHAVE);
      } catch {
        /* tudo bem */
      }
      chamarFuncao("musica/agora").catch(() => {});
      router.push(`/minhas/${data}?nova=1`);
    } catch (e) {
      setErro(mensagemErro(e));
      setEnviando(false);
    }
  }

  return (
    <div className="mt24">
      {/* passo 1 */}
      <div className="passo"><i>1</i> Você já tem a letra pronta?</div>
      <div className="opcoes">
        <button type="button" className="opcao" aria-pressed={r.temLetra === true} onClick={() => mudar({ temLetra: true, passo: Math.max(r.passo, 2) })}>
          <IcDoc /> Sim, tenho letra
        </button>
        <button type="button" className="opcao" aria-pressed={r.temLetra === false} onClick={() => mudar({ temLetra: false, passo: Math.max(r.passo, 2) })}>
          <IcBrilho /> Não, a IA cria
        </button>
      </div>

      {/* passo 2 */}
      {r.passo >= 2 && r.temLetra !== null ? (
        <section className="secao">
          <div className="passo"><i>2</i> {r.temLetra ? "Cole sua letra" : "Conte a história"}</div>
          <div className="pilha mt16">
            <div className="campo-grupo">
              <label htmlFor="para">Para quem é a música? <span className="muted">(opcional)</span></label>
              <input id="para" className="campo" placeholder="Ex.: minha mãe, Ana, meu time" maxLength={60} value={r.paraQuem} onChange={(e) => mudar({ paraQuem: e.target.value })} />
            </div>
            {r.temLetra ? (
              <>
                <div className="campo-grupo">
                  <label htmlFor="titulo">Título <span className="muted">(opcional)</span></label>
                  <input id="titulo" className="campo" placeholder="Como a música vai se chamar" maxLength={80} value={r.titulo} onChange={(e) => mudar({ titulo: e.target.value })} />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="letra">Letra</label>
                  <textarea id="letra" className="campo" style={{ minHeight: 220 }} maxLength={3000} placeholder={"[Verso]\n...\n[Refrão]\n..."} value={r.letra} onChange={(e) => mudar({ letra: e.target.value })} />
                  <span className="ajuda">{r.letra.length}/3.000 · Use [Verso] e [Refrão] para separar as partes, se quiser.</span>
                </div>
              </>
            ) : (
              <>
                <div className="campo-grupo">
                  <label htmlFor="historia">Qual é a história ou a emoção?</label>
                  <textarea id="historia" className="campo" maxLength={1500} placeholder="Conte o que você quer emocionar: um amor, uma conquista, uma amizade, uma superação. Detalhes deixam a música mais sua." value={r.historia} onChange={(e) => mudar({ historia: e.target.value })} />
                  <span className="ajuda">{r.historia.length}/1.500 · Aqui a gente só cria músicas para emocionar: superação vale, história triste não.</span>
                </div>
                <div className="campo-grupo">
                  <label htmlFor="titulo2">Título <span className="muted">(opcional, a IA sugere se ficar vazio)</span></label>
                  <input id="titulo2" className="campo" maxLength={80} value={r.titulo} onChange={(e) => mudar({ titulo: e.target.value })} />
                </div>
              </>
            )}
            <button type="button" className="btn btn-sec" disabled={!podeAvancar2} onClick={() => mudar({ passo: Math.max(r.passo, 3) })}>Continuar</button>
          </div>
        </section>
      ) : null}

      {/* passo 3 */}
      {r.passo >= 3 ? (
        <section className="secao">
          <div className="passo"><i>3</i> Estilo e voz</div>
          <div className="chips mt16" role="group" aria-label="Estilo musical">
            {ESTILOS.map((e) => (
              <button key={e.id} type="button" className="chip laranja-on" aria-pressed={r.estilo === e.id} onClick={() => mudar({ estilo: e.id })}>{e.nome}</button>
            ))}
          </div>
          <div className="segmento mt16" role="group" aria-label="Voz">
            <button type="button" aria-pressed={r.voz === "feminina"} onClick={() => mudar({ voz: "feminina" })}>Voz feminina</button>
            <button type="button" aria-pressed={r.voz === "masculina"} onClick={() => mudar({ voz: "masculina" })}>Voz masculina</button>
          </div>
          <button type="button" className="btn btn-sec mt16" disabled={!r.estilo} onClick={() => mudar({ passo: 4 })}>Revisar</button>
        </section>
      ) : null}

      {/* passo 4 */}
      {r.passo >= 4 ? (
        <section className="secao">
          <div className="passo"><i>4</i> Tudo certo?</div>
          <div className="cartao mt16">
            <dl className="resumo" style={{ margin: 0 }}>
              {r.paraQuem ? (<><dt>Para</dt><dd>{r.paraQuem}</dd></>) : null}
              {r.titulo ? (<><dt>Título</dt><dd>{r.titulo}</dd></>) : null}
              <dt>{r.temLetra ? "Letra" : "História"}</dt>
              <dd style={{ maxHeight: 160, overflow: "auto" }}>{r.temLetra ? r.letra : r.historia}</dd>
              <dt>Estilo e voz</dt>
              <dd>{nomeEstilo(r.estilo)} · voz {r.voz}</dd>
            </dl>
            <label className="alternar">
              <input type="checkbox" checked={r.palco} onChange={(e) => mudar({ palco: e.target.checked })} />
              <span><b>Tocar no Palco</b><br /><span className="pequeno">Sua música entra na fila da boate, para todo mundo ouvir. Você pode mudar isso depois.</span></span>
            </label>
          </div>
          <p className="pequeno mt12">Você recebe duas versões da música. Ela fica no app para ouvir e compartilhar; os direitos são divididos 50/50 com a plataforma.</p>
          {erro ? <p className="erro-msg mt12" role="alert">{erro}</p> : null}
          {creditos > 0 ? (
            <button type="button" className="btn btn-pri mt16" onClick={criar} disabled={enviando}>
              {enviando ? "Enviando para o estúdio…" : `Criar minha música · 1 crédito`}
            </button>
          ) : (
            <Link href="/comprar?volta=/criar" className="btn btn-pri mt16">Comprar créditos para criar</Link>
          )}
          <p className="pequeno centro mt12">Você tem {creditos} {creditos === 1 ? "crédito" : "créditos"}. <Link href="/comprar">Comprar mais</Link></p>
          <button type="button" className="link centro" style={{ display: "block", margin: "8px auto 0" }} onClick={() => { setR(VAZIO); try { localStorage.removeItem(CHAVE); } catch { /* ok */ } }}>Começar de novo</button>
        </section>
      ) : null}
    </div>
  );
}

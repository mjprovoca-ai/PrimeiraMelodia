import type { Metadata } from "next";
import EsgTela from "@/components/EsgTela";
import { meuPerfil, supabaseServidor } from "@/lib/supabase/server";
import { brl } from "@/lib/dados";

export const metadata: Metadata = { title: "Projetos ESG" };

export default async function Esg() {
  const sb = await supabaseServidor();
  const [{ data: painel }, perfil] = await Promise.all([sb.rpc("esg_painel"), meuPerfil()]);
  const p = painel ?? { ano: new Date().getFullYear(), fundo_centavos: 0, percentual: 10, finalistas: [], meu_voto: null, meus_projetos: [] };
  return (
    <>
      <h1 className="titulo">Projetos ESG 🌍</h1>
      <p className="sub">Música que transforma o planeta</p>

      <div className="cartao verde-bg como-esg mt20">
        <h2>🌱 Como funciona</h2>
        <ol>
          <li>Envie seu projeto ESG: planeta, oceano ou floresta.</li>
          <li>A equipe da holding do Primeira Melodia (Eterna) faz a pré-curadoria.</li>
          <li>Três finalistas por ano vão à votação pública.</li>
          <li>O projeto mais votado recebe o investimento do Primeira Melodia. 💚</li>
        </ol>
      </div>

      <div className="cartao mt16 linha-flex" style={{ alignItems: "center" }}>
        <img src="/marca/selo-esg.svg" alt="" width={74} height={74} style={{ flex: "none" }} />
        <div>
          <p className="pequeno">Fundo {p.ano} · {Number(p.percentual)}% de cada música</p>
          <p className="fundo-valor">{brl(p.fundo_centavos)}</p>
          <p className="pequeno">vai para o projeto vencedor</p>
        </div>
      </div>

      <EsgTela painel={p} logado={Boolean(perfil)} />
    </>
  );
}
